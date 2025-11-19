import type { UserRepository } from "../../domain/repository/UserRepository";
import { FirebaseDataSource } from "../datasource/FirebaseDataSource";
import { User } from "../../domain/model/User";

export class UserRepositoryFirebase implements UserRepository {
  private dataSource = new FirebaseDataSource();
  
  async deleteUser(userId: string): Promise<void> {
    await this.dataSource.deleteUser(userId);
  }
  
}