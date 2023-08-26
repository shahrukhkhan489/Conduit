import { Component, OnInit } from '@angular/core';
import { UserData } from './user.model';
import { UserService } from './user.service';

@Component({
  selector: 'app-roster',
  templateUrl: './roster.component.html',
  styleUrls: ['./roster.component.css'],
})
export class RosterComponent implements OnInit {
  users: UserData[] = [];
  users$ = this.userService.getUsersWithStats();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getUsersWithStats().subscribe((data) => {
      this.users = data;
    });
  }

}
