import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  OwnershipTransferred,
  Result
} from "../generated/VRFv2Consumer/VRFv2Consumer"

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createResultEvent(
  uri: string,
  number: BigInt,
  result: boolean,
  x: i32,
  z: i32
): Result {
  let resultEvent = changetype<Result>(newMockEvent())

  resultEvent.parameters = new Array()

  resultEvent.parameters.push(
    new ethereum.EventParam("uri", ethereum.Value.fromString(uri))
  )
  resultEvent.parameters.push(
    new ethereum.EventParam("number", ethereum.Value.fromUnsignedBigInt(number))
  )
  resultEvent.parameters.push(
    new ethereum.EventParam("result", ethereum.Value.fromBoolean(result))
  )
  resultEvent.parameters.push(
    new ethereum.EventParam(
      "x",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(x))
    )
  )
  resultEvent.parameters.push(
    new ethereum.EventParam(
      "z",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(z))
    )
  )

  return resultEvent
}
