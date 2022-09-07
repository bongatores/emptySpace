import { useState, useEffect } from 'react';

import {
  Box,
  Tab,
  Tabs
} from 'grommet';
import { ethers } from "ethers";

import { ENS } from '@ensdomains/ensjs'

import addresses from "./contracts/addresses";
import abis from "./contracts/abis";


import { AppContext, useAppState } from './hooks/useAppState'

import useWeb3Modal from './hooks/useWeb3Modal'
import useClient from './hooks/useGraphClient';


import Game from './Game';

import MainHeader from './components/MainHeader';
import GameHeader from './components/GameHeader';
import Instructions from './components/Instructions';

import UseWalletSection from './components/UseWalletSection';
import UseSelfIdSection from './components/UseSelfIdSection';
import ConnectNFTSection from './components/ConnectNFTSection';
import ConnectENSSection from './components/ConnectENSSection';
import MyUNS from './components/MyUNS';


export default function App() {

  const { state, actions } = useAppState();

  const {
    provider,
    coinbase,
    netId,
    loadWeb3Modal,
    logoutOfWeb3Modal,
    user,
  } = useWeb3Modal();
  const {
    client,
    initiateClient,
    getNftsFrom,
    getENSFrom
  } = useClient();


  const [profile, setProfile] = useState();
  const [self, setSelf] = useState();
  const [myOwnedNfts, setMyOwnedNfts] = useState();

  const [myOwnedENS, setMyOwnedENS] = useState();
  const [myOwnedERC1155, setMyOwnedERC1155] = useState();

  const [gameContract, setGameContract] = useState();

  const [loadingMyNFTs, setLoadingMyNFTs] = useState(true);

  const [loadingMyENS, setLoadingMyENS] = useState(true);

  const [uri, setUri] = useState();



  const [name, setName] = useState();
  const [description, setDescription] = useState();
  const [img, setImg] = useState();
  const [scenario, setScenario] = useState();
  const [url, setUrl] = useState();



  const ENSInstance = new ENS()


  const getMetadata = item => {
    return (
      new Promise(async (resolve, reject) => {
        try {
          let uri;
          let tokenURI;
          const contractAddress = item.id.split("/")[0];
          //ERC1155
          if (item.token) {
            tokenURI = item.token.uri;
          } else {
            tokenURI = item.uri;
          }

          let returnObj = {
            uri: tokenURI
          }

          if (!tokenURI) {
            resolve({});
          }
          if (!tokenURI.includes("://")) {
            uri = `https://ipfs.io/ipfs/${tokenURI}`;
          } else if (tokenURI.includes("ipfs://ipfs/")) {
            uri = tokenURI.replace("ipfs://ipfs/", "https://ipfs.io/ipfs/");
          } else if (tokenURI.includes("ipfs://") && !tokenURI.includes("https://ipfs.io/ipfs/")) {
            uri = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
          } else if (tokenURI.includes("data:application/json;base64")) {
            uri = tokenURI.replace("data:application/json;base64,", "");
          } else {
            uri = tokenURI;
          }
          let metadataToken;
          if (tokenURI.includes("data:application/json;base64")) {
            metadataToken = JSON.parse(atob(tokenURI.replace("data:application/json;base64,", "")));
          } else {
            metadataToken = JSON.parse(await (await fetch(uri)).text());
          }
          returnObj.address = contractAddress;
          returnObj.metadata = metadataToken;
          resolve(returnObj)
        } catch (err) {
          resolve({});
        }
      })
    )
  }

  useEffect(() => {
    actions.setProvider(provider);
    actions.setCoinbase(coinbase);
    actions.setNetId(netId);
    actions.setProfile(profile);
    actions.setUser(user);
    actions.setUri(uri);
    actions.setSelf(self);
    actions.setGameContract(gameContract);
  },[
    coinbase,
    provider,
    netId,
    user,
    profile,
    self,
    uri,
    gameContract
  ]);
  useEffect(() => {
    initiateClient(netId);
    actions.setNetId(netId);
  },[netId]);

  useEffect(() => {
    let newGameContract;
    if (netId === 4) {
      newGameContract = new ethers.Contract(addresses.game.rinkeby, abis.game, provider);
    } else if (netId === 5) {
      newGameContract = new ethers.Contract(addresses.game.goerli, abis.game, provider);
    } else {
      newGameContract = new ethers.Contract(addresses.game.mumbai, abis.game, provider);
    }
    setGameContract(newGameContract);

  },[netId,provider])

  useEffect(async () => {
    if (client && coinbase && netId && !user) {
      try {
        const ownedNfts = await getNftsFrom(coinbase, netId);
        console.log(ownedNfts)
        let promises;
        if (ownedNfts.data.accounts[0]?.ERC721tokens) {
          const erc721Tokens = ownedNfts.data.accounts[0].ERC721tokens;
          promises = erc721Tokens.map(getMetadata);
          const newMyOwnedNfts = await Promise.all(promises)

          setMyOwnedNfts(newMyOwnedNfts);
        }

        if (ownedNfts.data.accounts[0]?.ERC1155balances) {
          const erc1155Tokens = ownedNfts.data.accounts[0].ERC1155balances;
          promises = erc1155Tokens.map(getMetadata);
          const newMyOwnedERC1155 = await Promise.all(promises)
          setMyOwnedERC1155(newMyOwnedERC1155);
        }
        setLoadingMyNFTs(false);
      } catch (err) {
        console.log(err)
        setLoadingMyNFTs(false);
      }

      try {
        const ownedENS = await getENSFrom(coinbase);
        if(!ownedENS.data.account) return
        const listOfOwnedDomains = ownedENS.data.account.domains

        console.log(listOfOwnedDomains)

        await ENSInstance.setProvider(provider)

        const myENS = [];

        for (let i = 0; i < listOfOwnedDomains.length; i++) {

          let domainName = listOfOwnedDomains[i].name;
          let resolver = await provider.getResolver(domainName);
          let contentHash = await resolver.getContentHash();

          let newENS = {
            domainName: domainName,
            contentHash: contentHash
          }

          myENS.push(newENS)
        }

        console.log(myENS);

        setMyOwnedENS(myENS);

        setLoadingMyENS(false);
      }
      catch (err) {
        console.log(err)
        setLoadingMyENS(false);

      }


    }
  }, [client, coinbase, netId, user]);


  // const getENSFrom = async function (coinbase) {

  //   console.log("coinbase", coinbase);

  //   await ENSInstance.setProvider(provider)

  //   console.log("ENSInstance", ENSInstance);

  //   const address = coinbase;

  //   let ensName = null;


  //   console.log(await ENSInstance.getName(address));

  //   ({ name: ensName } = await ENSInstance.getName(address))

  //   console.log(ensName);

  //   let owner = null;

  //   ({ owner: owner } = await ENSInstance.getOwner(ensName));


  //   if (ensName == null || address != owner) {
  //     ensName = null;
  //   }

  //   return ensName;

  // }

  return (
    <AppContext.Provider value={{ state, actions }}>
      <Game />
      <Box id="blocker">
        <MainHeader
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          setSelf={setSelf}
          setProfile={setProfile}
        />
        <Box align="center" className='menu_box'>
          <GameHeader
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
            setSelf={setSelf}
            setProfile={setProfile}
            setUri={setUri}
          />
          {
            user ?
            <MyUNS
              setMetadata={setUri}
            /> :
            <Tabs>
              {
                /*
                <Tab title="Write message">
                  <Text>Message</Text>
                  <TextInput id="textInput"/>
                </Tab>
                */
              }
              {
                coinbase && !profile &&
                <Tab title="Use Wallet">
                  <UseWalletSection setUri={setUri} />
                </Tab>
              }
              {
                coinbase &&
                <Tab title="Use NFT">
                  <br></br>
                  <ConnectNFTSection
                     client={client}
                     loadingMyNFTs={loadingMyNFTs}
                     myOwnedERC1155={myOwnedERC1155}
                     myOwnedNfts={myOwnedNfts}
                     setMetadata={setUri}
                  />
                </Tab>
              }

              {
                coinbase && myOwnedENS?.length > 0 &&
                <Tab title="Use ENS">
                  <br></br>
                  <ConnectENSSection
                    client={client}
                    loadingMyENS={loadingMyENS}
                    myOwnedENS={myOwnedENS}
                    setMetadata={setUri}
                  />
                </Tab>
              }

              {
                self &&
                <Tab title="Use Profile">
                  <UseSelfIdSection
                    setName={setName}
                    setDescription={setDescription}
                    setImg={setImg}
                    setUrl={setUrl}
                    setScenario={setScenario}
                    name={name}
                    description={description}
                    url={url}
                    scenario={scenario}
                    setUri={setUri}
                    setProfile={setProfile}
                  />
                </Tab>
              }
            </Tabs>
          }

          <Instructions />
        </Box>
      </Box>
      <Box id="canvas-container" align="center">
      </Box>
    </AppContext.Provider>
  )
}
