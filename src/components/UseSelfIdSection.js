import React,{useState,useEffect} from 'react'
import {
  Button,
  Heading,
  Box,
  TextInput,
  Text,
  FileInput,
  Accordion,
  AccordionPanel,
  Spinner
 } from 'grommet';

import { useAppContext } from '../hooks/useAppState'
import { NFTStorage } from 'nft.storage'

const fr = new FileReader();
const client = new NFTStorage({ token: process.env.REACT_APP_NFT_STORAGE_API })


export default function UseSelfIdSection(props){

  const { state } = useAppContext();

  const [file,setFile] = useState();
  const [files,setFiles] = useState();
  const [uploading,setUploading] = useState();
  const [image,setImage] = useState();

  useEffect(() => {
    fr.addEventListener('progress', event => {setUploading(true)});
    fr.addEventListener('load', async event => {
      const img = event.target.result;
      setImage(img);
      setUploading(false)
    });
  },[])

  useEffect(() => {
    if(file){
      fr.readAsArrayBuffer(file)
    }
  },[file])


  return(
    <>
    {
      uploading &&
      <Spinner />
    }
    <Accordion>
    <AccordionPanel label="Edit Profile">
      <Box style={{wordBreak: 'break-word'}}>
        <Text>Name</Text>
        <TextInput placeholder={state.profile?.name} onChange={event => props.setName(event.target.value)}/>
        <Text>Description</Text>
        <TextInput  placeholder={state.profile?.description} onChange={event => props.setDescription(event.target.value)}/>
        <Text>Image</Text>
        <FileInput
          name="Image"
          accept="image/*"
          onChange={event => {
            const fileList = event.target.files;
            setFile(fileList[0]);
          }}
        />
        {
          image &&
          <Button secondary label="Upload Image to IPFS" size="xsmall" onClick={async () => {
            console.log(image);
            setUploading(true)
            const storageRes = await NFTStorage.encodeBlob(new Blob([image]));
            const cidNftStorageMetadata = await client.storeCar(storageRes.car);
            setUploading(true)
          }} />
        }
        <Text>URL</Text>
        <TextInput  placeholder={state.profile?.url} onChange={event => props.setUrl(event.target.value)}/>
        <Text>Scenario</Text>
        <FileInput
          name="Scenario"
          onChange={event => {
            const fileList = event.target.files;
            setFiles(fileList[0]);
          }}
        />
        {
          files &&
          <Button secondary label="Upload Scenario to IPFS" size="xsmall" onClick={async () => {
            console.log(files)
          }} />
        }
        <Button secondary label="Save Profile" onClick={async () => {
          setUploading(true);
          console.log(props)
          await state.self.merge('basicProfile',{
            name: props.name,
            description: props.description,
            //image: makeBlockie(self.id),
            url: props.url,
            scenario: props.scenario
          });
          const newProfile = await state.self.get('basicProfile');
          props.setProfile(newProfile);
          props.setUri(state.self.id)
          console.log("Profile Saved")
          setUploading(false);
        }} />
      </Box>
    </AccordionPanel>
    <Box style={{wordBreak: 'break-word'}}>
      <Heading level="4">Actual Profile</Heading>
      {
        state.uri !== state.self?.id &&
        <Button secondary label="Set Profile URI" onClick={() => props.setUri(state.self.id)} />
      }
      <Text>Name: {state.profile?.name}</Text>
      <Text>Description: {state.profile?.description}</Text>
      <Text>Image: {state.profile?.image}</Text>
      <Text>URL: {state.profile?.url}</Text>
      <Text>Scenario: {state.profile?.scenario}</Text>

    </Box>
    </Accordion>
    </>
  )
}
