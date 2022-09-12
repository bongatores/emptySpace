import { useEffect, useRef } from 'react'
import * as THREE from 'three';
import makeBlockie from 'ethereum-blockies-base64';
import { ethers } from "ethers";

import SpriteText from 'three-spritetext';


import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
//import { AmmoPhysics } from 'three/addons/physics/AmmoPhysics.js';
import Resolution from '@unstoppabledomains/resolution';


import { Core } from '@self.id/core'

import { useAppContext } from './hooks/useAppState'

const core = new Core({ ceramic: 'testnet-clay' })

const resolution = Resolution.fromEthersProvider(new ethers.providers.JsonRpcProvider("https://rpc-mainnet.maticvigil.com"));


export default function Game(props) {


  const { state } = useAppContext();
  const ref = useRef({});

  useEffect(() => {
    init();
    animate();
  }, []);
  useEffect(() => {
    ref.current = state
  }, [state]);
  useEffect(() => {
    ref.current.client = props.client;
    ref.current.getGameUris = props.getGameUris;
  },[props])
  let camera, scene, renderer, controls;
  const objects = [];
  let raycaster;

  let moveForward = false;
  let moveBackward = false;
  let moveLeft = false;
  let moveRight = false;
  let canJump = false;

  let prevTime = performance.now();
  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const vertex = new THREE.Vector3();
  const color = new THREE.Color();
  const infos = [];

  const onKeyDown = async function (event) {

    switch (event.code) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = true;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = true;
        break;

      case 'KeyP':
        camera.updateMatrixWorld();
        const vector = camera.position.clone();
        console.log(vector)
        const x = (vector.x/10).toFixed(0);
        const z = (vector.z/10).toFixed(0);
        console.log(`Inserting data at ${x},${z}`)
        const coinbaseGame = ref.current.coinbase;
        const contract = ref.current.gameContract;
        const gameProvider = ref.current.provider;
        const sendingTxGame = ref.current.sendingTx;
        console.log(ref.current)
        if (!sendingTxGame && coinbaseGame && contract) {
          ref.current = {
            ...ref.current,
            sendingTx: true
          }
          try {
            let string = ref.current.uri;
            console.log(string)
            if (!string) return;
            const signer = gameProvider.getSigner();
            const gameContractWithSigner = contract.connect(signer);
            const tx = await gameContractWithSigner.requestRandomWords(string,[x,z]);
            await tx.wait();
          } catch (err) {
            console.log(err)
          }
          ref.current = {
            ...ref.current,
            sendingTx: false
          }
        }

        break;

      case 'Space':
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;

    }

  };

  const onKeyUp = function (event) {

    switch (event.code) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = false;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = false;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = false;
        break;

    }

  };


  const checkUris = async () => {
    const contractInitiated = ref.current?.contractInitiated;
    const contract = ref.current?.gameContract;
    const getGameUris = ref.current?.getGameUris;

    if (contract && !contractInitiated) {
        const results = await getGameUris();
        const infos = results.data.infos;
        infos.map(async info => {

                    //const uriGame = await contract.uri(info.x,info.z);
                    const uriGame = info.uri
                    let metadata;
                    if(uriGame){
                        console.log(`${uriGame} at ${info.x},${info.z}`)
                        try{
                          if (uriGame.startsWith("did:3")) {
                            // Get profile info from ceramic.network
                            const userProfile = await core.get('basicProfile', uriGame);
                            if (!userProfile) {
                              return
                            }
                            metadata = {
                              name: userProfile.name ? userProfile.name : uriGame,
                              description: userProfile.description,
                              image: userProfile.image ?
                                userProfile.image :
                                makeBlockie(uriGame),
                              external_url: userProfile.url,
                              scenario: userProfile.scenario
                            }
                          }
                          else if (uriGame.endsWith(".eth")) {

                            const provider = ref.current.provider;

                            let providerENS;
                            if (provider.network.chainId != 4 && provider.network.chainId != 5) {
                              // Use rinkeby default network for networks that do not have ENS support PROOF OF CONCEPT
                              providerENS = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth_rinkeby")
                            }
                            else {
                              providerENS = provider;
                            }


                            const resolver = await providerENS.getResolver(uriGame)

                            const scenario = await resolver.getText("scenario");
                            const avatar = await resolver.getText("avatar");

                            const description = await resolver.getText("description");

                            const url = await resolver.getText("url");

                            metadata = {
                              name: uriGame,
                              description: description,
                              image: avatar,
                              external_url: url,
                              scenario: scenario
                            }

                          }
                          else if (uriGame.endsWith('.crypto')) {
                            // UNS domain
                            const records = await resolution.records(
                              uriGame,
                              [
                                "profile.name.value",
                                "profile.description.value",
                                "ipfs.html.value",
                                "profile.image.value",
                                "emptyspace.gltf.value"
                              ]
                            );
                            console.log(records)
                            console.log(`Domain ${uriGame} ipfs hash is: ${records["ipfs.html.value"]}`);
                            metadata = {
                              name: records["profile.name.value"] ?
                                    records["profile.name.value"] :
                                    uriGame,
                              description: records["profile.description.value"],
                              image: records["profile.image.value"] ?
                                     records["profile.image.value"] :
                                     `https://metadata.unstoppabledomains.com/image-src/${uriGame}.svg`,
                              external_url: records["ipfs.html.value"],
                              scenario: records["emptyspace.gltf.value"]
                            }
                          } else {
                            // Assumes it is nft metadata
                            metadata = JSON.parse(await (await fetch(`https://nftstorage.link/ipfs/${uriGame.replace("ipfs://", "")}`)).text());
                          }

                          const gameInfo = new THREE.Group()
                          const imgTexture = new THREE.TextureLoader().load(metadata.image.replace("ipfs://", "https://nftstorage.link/ipfs/"));
                          const material = new THREE.SpriteMaterial({ map: imgTexture });
                          const sprite = new THREE.Sprite(material);
                          console.log(metadata)
                          const name = new SpriteText(metadata.name, 8, "red");
                          const description = new SpriteText(metadata.description, 3, "blue")
                          const external_url = new SpriteText(metadata.external_url, 1, "green")
                          sprite.scale.set(20, 20, 20)
                          name.position.y = 40;
                          description.position.y = 25;
                          external_url.position.y = 12
                          gameInfo.add(sprite)
                          gameInfo.add(name)
                          gameInfo.add(description)
                          gameInfo.add(external_url)
                          if (metadata.scenario) {
                            const loader = new GLTFLoader().setPath(`https://nftstorage.link/ipfs/${metadata.scenario}/gltf/`);
                            loader.load('scene.gltf', function (gltf) {
                              console.log(gltf)
                              gltf.scene.scale.set(gltf.scene.scale.x * 1.2, gltf.scene.scale.y * 1.2, gltf.scene.scale.z * 1.2)
                              gltf.scene.position.set(info.x*10, 1, info.z*10)
                              scene.add(gltf.scene);


                            });
                          }

                          scene.add(gameInfo);
                          if(metadata.scenario){
                            const loader = new GLTFLoader().setPath(`https://nftstorage.link/ipfs/${metadata.scenario}/gltf/` );
                            loader.load( 'scene.gltf', function ( gltf ) {
                              console.log(gltf)
                              gltf.scene.position.set(info.x*10,1,info.z*10)
                              gltf.scene.scale.set(gltf.scene.scale.x*1.2,gltf.scene.scale.y*1.2,gltf.scene.scale.z*1.2)
                              scene.add( gltf.scene );


                            } );
                          }
                          gameInfo.position.set(info.x*10, 10, info.z*10)
                          infos[info.id] = gameInfo;
                        } catch(err){
                          console.log(err)
                        }
                      }
        })
        for(const info of infos){


        }
        const filter = contract.filters.Result();
        contract.on(filter, handleEvents)
    }
    ref.current = {
      ...ref.current,
      contractInitiated: true
    }
  }

  const handleEvents = (uri, number,requestId, result,x,z) => {

    console.log(`Event: URI - ${uri} Result - ${result} - ${x},${z}`);
    if (result) {
      if (uri === ref.current?.uri) {

      } else {

      }
    } else {
      let i = 0;
      if (uri === ref.current?.uri) {

      } else {

      }
      /*
      const metorsInterval = setInterval(() => {
        if(i < 100){

        } else {
          clearInterval(metorsInterval);
        }
        i = i + 1;
      },500);
      */

    }
  }

  const generateFloor = () => {
    // floor

    let floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    floorGeometry.rotateX(- Math.PI / 2);

    // vertex displacement

    let position = floorGeometry.attributes.position;

    for (let i = 0, l = position.count; i < l; i++) {

      vertex.fromBufferAttribute(position, i);

      vertex.x += Math.random() * 20 - 10;
      vertex.y += Math.random() * 2;
      vertex.z += Math.random() * 20 - 10;

      position.setXYZ(i, vertex.x, vertex.y, vertex.z);

    }

    floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

    position = floorGeometry.attributes.position;
    const colorsFloor = [];

    for (let i = 0, l = position.count; i < l; i++) {

      color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
      colorsFloor.push(color.r, color.g, color.b);

    }

    floorGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsFloor, 3));

    const floorMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(1000,0,1000)

    scene.add(floor);
  }

  async function init() {

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(1000,2,1000)
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0xffffff, 0, 750);

    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);
    controls = new PointerLockControls(camera, document.body);

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', function () {
      controls.lock();
    });

    controls.addEventListener('lock', function () {

      instructions.style.display = 'none';
      blocker.style.display = 'none';

    });

    controls.addEventListener('unlock', function () {

      blocker.style.display = 'block';
      instructions.style.display = '';

    });

    scene.add(controls.getObject());

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10);

    generateFloor();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.getElementById("canvas-container").appendChild(renderer.domElement);



    window.addEventListener('resize', onWindowResize);

  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

  }

  async function animate() {

    const contractInitiated = ref.current?.contractInitiated;
    const client = ref.current?.client;
    if (!contractInitiated && client) {
      await checkUris();
    }
    requestAnimationFrame(animate);
    const time = performance.now();
    if (controls.isLocked === true) {

      raycaster.ray.origin.copy(controls.getObject().position);
      raycaster.ray.origin.y -= 10;

      const intersections = raycaster.intersectObjects(objects, false);

      const onObject = intersections.length > 0;

      const delta = (time - prevTime) / 1000;

      velocity.x -= velocity.x * 10.0 * delta;
      velocity.z -= velocity.z * 10.0 * delta;

      velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

      direction.z = Number(moveForward) - Number(moveBackward);
      direction.x = Number(moveRight) - Number(moveLeft);
      direction.normalize(); // this ensures consistent movements in all directions

      if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
      if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

      if (onObject === true) {

        velocity.y = Math.max(0, velocity.y);
        canJump = true;

      }

      controls.moveRight(- velocity.x * delta);
      controls.moveForward(- velocity.z * delta);

      controls.getObject().position.y += (velocity.y * delta); // new behavior

      if (controls.getObject().position.y < 10) {

        velocity.y = 0;
        controls.getObject().position.y = 10;

        canJump = true;

      }

    }

    prevTime = time;

    renderer?.render(scene, camera);

  }

  return (
    <>
    </>
  )
}
