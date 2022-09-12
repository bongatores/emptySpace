import { useState } from "react";

// Enter a valid infura key here to avoid being rate limited
// You can get a key for free at https://infura.io/register
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const APIURL_XDAI = "https://api.thegraph.com/subgraphs/name/leon-do/xdai-erc721-erc1155";
const APIURL_ETH = "https://api.thegraph.com/subgraphs/name/ryry79261/mainnet-erc721-erc1155";
const APIURL_POLYGON = "https://api.thegraph.com/subgraphs/name/ryry79261/polygon-erc721-erc1155";
const APIURL_BSC = "https://api.thegraph.com/subgraphs/name/leon-do/bsc-erc721-erc1155";
const APIURL_BOBA = "https://api.thegraph.com/subgraphs/name/quantumlyy/eip721-subgraph-boba";
const APIURL_AVALANCHE = "https://api.thegraph.com/subgraphs/name/leon-do/avalanche-erc721-erc1155";

const APIURL_RINKEBY = "https://api.thegraph.com/subgraphs/name/leon-do/rinkeby-erc721-erc1155";
const APIURL_GOERLI = "https://api.thegraph.com/subgraphs/name/ryry79261/goerli-erc721-erc1155";
const APIURL_MUMBAI = "https://api.thegraph.com/subgraphs/name/leon-do/mumbai-erc721-erc1155"


const ENS_ETH = 'https://api.thegraph.com/subgraphs/name/ensdomains/ens';
const ENS_RINKEBY = 'https://api.thegraph.com/subgraphs/name/ensdomains/ensrinkeby';
const ENS_GOERLI = 'https://api.thegraph.com/subgraphs/name/ensdomains/ensgoerli';

const EMPTY_SPACE_GRAPH = "https://api.thegraph.com/subgraphs/name/henrique1837/empty-space"

function useGraphClient() {
  const [client, setClient] = useState();
  const [ensClient, setENSClient] = useState();
  const [gameClient, setGameClient] = useState();

  const initiateClient = (netId) => {
    //if(!client && netId){
    let newClient = new ApolloClient({
      uri: APIURL_GOERLI,
      cache: new InMemoryCache()
    });
    let newENSClient = new ApolloClient({
      uri: ENS_GOERLI,
      cache: new InMemoryCache()
    });
    if (netId === 1) {
      newClient = new ApolloClient({
        uri: APIURL_ETH,
        cache: new InMemoryCache()
      });
      newENSClient = new ApolloClient({
        uri: ENS_ETH,
        cache: new InMemoryCache()
      })
    }
    if (netId === 0x64) {
      newClient = new ApolloClient({
        uri: APIURL_XDAI,
        cache: new InMemoryCache()
      });
    }
    if (netId === 137) {
      newClient = new ApolloClient({
        uri: APIURL_POLYGON,
        cache: new InMemoryCache()
      });
    }
    if (netId === 56) {
      newClient = new ApolloClient({
        uri: APIURL_BSC,
        cache: new InMemoryCache()
      });
    }
    if (netId === 288) {
      newClient = new ApolloClient({
        uri: APIURL_BOBA,
        cache: new InMemoryCache()
      });
    }
    if (netId === 43114) {
      newClient = new ApolloClient({
        uri: APIURL_AVALANCHE,
        cache: new InMemoryCache()
      });
    }
    if (netId === 4) {
      newClient = new ApolloClient({
        uri: APIURL_RINKEBY,
        cache: new InMemoryCache()
      });

      newENSClient = new ApolloClient({
        uri: ENS_RINKEBY,
        cache: new InMemoryCache()
      })
    }
    if (netId === 5) {
      newClient = new ApolloClient({
        uri: APIURL_GOERLI,
        cache: new InMemoryCache()
      });
      newENSClient = new ApolloClient({
        uri: ENS_GOERLI,
        cache: new InMemoryCache()
      })
    }
    if (netId === 80001) {
      newClient = new ApolloClient({
        uri: APIURL_MUMBAI,
        cache: new InMemoryCache()
      });
    }
    const newGameClient = new ApolloClient({
      uri: EMPTY_SPACE_GRAPH,
      cache: new InMemoryCache()
    });
    setClient(newClient);
    setENSClient(newENSClient);
    setGameClient(newGameClient);
  }
  const getNftsFrom = async (address, netId) => {
    let tokensQuery = `
      query {
        accounts(where: {id: "${address.toLowerCase()}"}) {
          id
          ERC721tokens {
            id,
            uri
          }
          ERC1155balances{
            id
            value
            token {
              id
              uri
            }
          }
        }
      }
   `;
    // No Support for ERC1155 boba yet
    if (netId === 288) {
      tokensQuery = `
        query {
          accounts(where: {id: "${address.toLowerCase()}"}) {
            id
            ERC721tokens {
              id,
              uri
            }
          }
        }
     `;
    }
    const results = await client.query({
      query: gql(tokensQuery)
    });
    return (results);
  }


  const getENSFrom = async (address) => {
    let getDomains = `
        query {
          account(id: "${address.toLowerCase()}") {
            domains(first: $first, skip: $skip, orderBy: $orderBy) {
            labelName
              labelhash
              name
              isMigrated
              parent {
                name
              }
            }
          }
        }
   `;

    const results = await ensClient.query({
      query: gql(getDomains)
    });
    return (results);
  }

  const getGameUris = async () => {
    const query = `
      query {
        infos(first: 100) {
          id
          uri
          x
          z
        }
      }
   `;
    const results = await gameClient.query({
      query: gql(query)
    });
    return (results);
  }


  return ({ client, initiateClient, getNftsFrom, getENSFrom, gameClient,getGameUris })
}

export default useGraphClient;
