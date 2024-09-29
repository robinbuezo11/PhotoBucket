import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { TablerIconsModule } from 'angular-tabler-icons';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { ImagesService } from '../../services/images.service'
import { AlbumsService } from "../../services/albums.service";
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';


import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexPlotOptions,
  ApexFill,
  ApexMarkers,
  ApexResponsive,
  NgApexchartsModule,
} from 'ng-apexcharts';
import {MatChip} from "@angular/material/chips";
import {DialogComponentComponent} from "../extra/dialog-component/dialog-component.component";
import {NewAlbumComponent} from "../extra/new-album/new-album.component";
import {ImageComponent} from "../extra/image/image.component";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    TablerIconsModule,
    MatCardModule,
    NgApexchartsModule,
    MatTableModule,
    CommonModule,
    MatFormFieldModule,
    MatChip
  ],
})

export class AppDashboardComponent implements OnInit{
  images = ['../assets/images/products/p3.jpg', '../assets/images/products/p3.jpg', '/assets/images/products/p3.jpg', '/assets/images/products/p3.jpg', '/assets/images/products/p3.jpg'];

  title = 'image-carousel';
  currentselected: any = '../assets/img1.jpg';
  prevselected: any;
  imagenes : any = [];
  albums : any = [];
  user: any;
  currentIndex = 0;
  itemsPerPage = 4;
  animate = false;

  ngOnInit(): void {
    this.user = JSON.parse(sessionStorage.getItem('userData') || '{}');
    if (this.user && this.user.token) {
      this.router.navigate(['/dashboard']);
    }
    this.albumService.getAlbumsByUser(this.user.id).subscribe((response) => {
      console.log(response);
      this.albums = response;
    });
    this.imageService.getImagesByUser(this.user.id).subscribe((response) => {
      console.log(response);
      this.imagenes = response;
    });
  }

  prevImage() {
    for (let i = 0; i < this.images.length; i++) {
      if (this.images[i] === this.currentselected && i > 0) {
        i--;
        this.currentselected = this.images[i];
        console.log(this.currentselected);
      } else if(this.images[i] === this.currentselected && i === 0) {
        this._snackBar.open('No more Images!', 'Navigate forward', {
          duration: 2000
        });
      }
    }
    const img = document.getElementsByClassName('image-container')[0] as HTMLImageElement;
    img.setAttribute('src', this.currentselected);
  }

  nextImage() {
    for (let i = 0; i < this.images.length; i++) {
      if (this.images[i] === this.currentselected && i < this.images.length - 1) {
        i++;
        this.currentselected = this.images[i];
        console.log(this.currentselected);
      } else if(this.images[i] === this.currentselected && i === this.images.length - 1) {
        this._snackBar.open('No more Images!', 'Navigate back', {
          duration: 2000
        });
      }
    }
    const img = document.getElementsByClassName('image-container')[0] as HTMLImageElement;
    img.setAttribute('src', this.currentselected);

  }

  constructor(
    private router: Router,
    private imageService: ImagesService,
    private albumService: AlbumsService,
    private _snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {
  }

  showOverlay() {
    const dialogRef = this.dialog.open(ImageComponent, {
      width: '500px',
    });

    dialogRef.componentInstance.imageSaved.subscribe((newImage) => {
      this.imagenes.push(newImage);
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        console.log('Result from dialog:', result);
      }
    });
  }

  showOverlay2(){
    const dialogRef = this.dialog.open(NewAlbumComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        console.log('Result from dialog:', result);
      }
    });
  }

  goToDetails(imageId: number) {
    this.router.navigate(['/extra/detail-image', imageId]);
  }

  prevItem() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  nextItem() {
    if (this.currentIndex < this.images.length - this.itemsPerPage) {
      this.currentIndex++;
    }
  }

  isVisible(index: number): boolean {
    return index >= this.currentIndex && index < this.currentIndex + this.itemsPerPage;
  }



}
