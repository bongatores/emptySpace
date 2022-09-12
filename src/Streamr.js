import { StreamrClient } from 'streamr-client';



let _streamr;


export function createStreamRClient(provider) {


    const streamr = new StreamrClient({
        auth: {
            // who fking cares
            ethereum: window.ethereum
        }
    })
    _streamr = streamr;

    console.log("client created");

}




// Subscribe to a stream



export async function subscribeStreamR(id,handleMessages) {

    await _streamr.subscribe({
        stream: id,
    },handleMessages)

    console.log("streamr Subscription started");
}



export function publishMessageStreamr(id,message) {
    // Publish messages to a stream
    _streamr.publish(id,message);
}
