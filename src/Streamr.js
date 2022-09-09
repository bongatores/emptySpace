import { StreamrClient } from 'streamr-client';



let _streamr;


export function createStreamRClient() {


    const streamr = new StreamrClient({
        auth: {
            // who fking cares
            privateKey: '606b37f399e43e2e534c9dd1e959c8191a3716ac5b29c156101e2d781897f037'
        }
    })
    _streamr = streamr;

    console.log("client created");

}




// Subscribe to a stream



export async function subscribeStreamR() {



    await _streamr.subscribe({
        stream: '0x1a34a1120e43c4e00dceb56fd21e220773dfd744/emptySpace',
    },
        (message) => {
            // This function will be called when new messages occur
            console.log(JSON.stringify(message))
        })

    console.log("streamr Subscription started");
}



export function publishMessageStreamr() {





    // Publish messages to a stream
    _streamr.publish('0x1a34a1120e43c4e00dceb56fd21e220773dfd744/emptySpace', {
        hello: 'world',
    })


}