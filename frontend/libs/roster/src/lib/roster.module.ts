import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RosterComponent } from './roster.component'; // Adjust path if necessary
import { UserService } from './user.service'; // Adjust path if necessary

import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [RosterComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule.forChild([
      { path: '', component: RosterComponent }
    ])
  ],
  providers: [UserService],
  exports: [RosterComponent],
})
export class RosterModule {}
