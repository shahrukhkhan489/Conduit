import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserData } from './user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly API_URL = 'http://localhost:3000'; // Replace with your API URL

  constructor(private http: HttpClient) {}

  getUsersWithStats(): Observable<UserData[]> {
    return this.http.get<UserData[]>(`${this.API_URL}/api/usersWithStats`);
  }
}
