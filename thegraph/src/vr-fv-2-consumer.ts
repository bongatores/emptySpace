import { BigInt } from "@graphprotocol/graph-ts"
import {
  VRFv2Consumer,
  Result
} from "../generated/VRFv2Consumer/VRFv2Consumer"
import { Info } from "../generated/schema"

export function handleResult(event: Result): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  const id = `${event.params.x}_${event.params.z}`;
  let info = Info.load(id);

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!info) {
    info = new Info(id)

    // Entity fields can be set using simple assignments
    info.uri = event.params.uri;
    info.x = event.params.x;
    info.z = event.params.z;
  } else if(event.params.result == true){
    info.uri = event.params.uri;
  }
  // Entities can be written to the store with `.save()`
  info.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.callbackGasLimit(...)
  // - contract.keyHash(...)
  // - contract.numWords(...)
  // - contract.owner(...)
  // - contract.posOccupied(...)
  // - contract.requestConfirmations(...)
  // - contract.requestPosition(...)
  // - contract.requestUri(...)
  // - contract.s_randomWords(...)
  // - contract.s_requestId(...)
  // - contract.s_subscriptionId(...)
  // - contract.uri(...)
  // - contract.vrfCoordinator(...)
}
