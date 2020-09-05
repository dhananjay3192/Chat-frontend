import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { UserDetailsComponent } from './user-details/user-details.component';
import { FirstCharComponent } from './first-char/first-char.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot()
  ],
  exports:[UserDetailsComponent,
    FirstCharComponent,
    CommonModule,
    FormsModule],
  declarations: [UserDetailsComponent, FirstCharComponent]
})
export class SharedModule { }
