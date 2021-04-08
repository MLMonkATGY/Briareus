// type DeviceInfo = {
//     deviceId: string,
//     apiKey : string
// }
export type PollDeviceStatusReqDTO = {
    devices: Array<Map<string, string>>
    //deviceId = key
    //apiKey = value
}