import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { MatDialogModule } from '@angular/material/dialog'; // Importar MatDialogModule
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// icons
import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';

import { ExtraRoutes } from './extra.routing';
import { AppIconsComponent } from './icons/icons.component';
import { AppSamplePageComponent } from './sample-page/sample-page.component';
import { DialogComponentComponent } from './dialog-component/dialog-component.component';
import { ImageComponent} from "./image/image.component";
import { NewAlbumComponent} from "./new-album/new-album.component";
import { EditAlbumComponent } from './edit-album/edit-album.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ExtraRoutes),
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    TablerIconsModule.pick(TablerIcons),
    NgOptimizedImage,
  ],
  declarations: [
    AppIconsComponent,
    AppSamplePageComponent,
    DialogComponentComponent,
    ImageComponent,
    NewAlbumComponent,
    EditAlbumComponent,
  ],
})
export class ExtraModule {}
