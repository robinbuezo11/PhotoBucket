import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';

import { AuthenticationRoutes } from './authentication.routing';

import { AppSideLoginComponent } from './login/login.component';
import { AppSideRegisterComponent } from './register/register.component';
import { FaceIDComponent } from "./face-id/face-id.component";
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {MatDivider} from "@angular/material/divider";
import {MatDialogActions, MatDialogContent} from "@angular/material/dialog";

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AuthenticationRoutes),
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule.pick(TablerIcons),
    MatSnackBarModule,
    MatDivider,
    MatDialogContent,
    MatDialogActions,
  ],
  declarations: [
    AppSideLoginComponent,
    AppSideRegisterComponent,
    FaceIDComponent,
  ],
})
export class AuthenticationModule {}
