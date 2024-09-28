import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ImagesService } from "../../../services/images.service";
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html'
})
export class AppMenuComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;

  selectedFile: File | null = null;
  selectedImage: string | null = null;
  extractedText: string | null = null;
  errorMessage: string | null = null;
  isLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private imagesService: ImagesService,
    private snackBar: MatSnackBar
  ) { }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  processImage(): void {
    if (this.selectedFile) {
      this.isLoading = true;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const imagData = {
          imagen: e.target.result
        };

        this.imagesService.showTextAnalysis(imagData).subscribe(
          (response) => {
            this.extractedText = response.labels.join(' ');
            this.isLoading = false;
            this.showSnackBar('Imagen procesada con éxito', 'Cerrar');
          },
          (error) => {
            this.isLoading = false;
            this.showSnackBar('Error al procesar la imagen. Inténtalo de nuevo', 'Cerrar');
            console.error('Error uploading image:', error);
          }
        );
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  reset(): void {
    this.selectedFile = null;
    this.selectedImage = null;
    this.extractedText = null;
    this.isLoading = false;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  showSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 3000,
    });
  }
}
