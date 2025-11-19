import { User } from "../../domain/model/User";
export interface UserRepository {
  deleteUser(userId: string): Promise<void> ;
  
}