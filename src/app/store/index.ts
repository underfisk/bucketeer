import { CloudStorage } from "./cloud-storage/cloud-storage.interface";
import { LocalStorage } from "./local-storage/local-storage.interface";

export interface IRootStore {
    cloudStorage: CloudStorage
    localStorage: LocalStorage
}
export default {}