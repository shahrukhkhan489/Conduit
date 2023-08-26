import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RosterComponent } from './roster.component'; // Adjust path if necessary
import { UserService } from './user.service'; // Adjust path if necessary

@NgModule({
  declarations: [RosterComponent],
  imports: [
    CommonModule,
    HttpClientModule, // This is required if your UserService makes HTTP requests
  ],
  providers: [UserService],
  exports: [RosterComponent], // This allows other modules to use the RosterComponent if necessary
})
export class RosterModule {}
