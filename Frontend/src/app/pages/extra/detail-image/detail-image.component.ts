import {Component, OnInit} from '@angular/core';
import {MatCard, MatCardContent, MatCardSubtitle, MatCardTitle} from "@angular/material/card";
import {MatChip} from "@angular/material/chips";
import { ImagesService} from "../../../services/images.service";
import {ActivatedRoute} from "@angular/router";
import {TablerIconsModule} from "angular-tabler-icons";
import {DatePipe, NgForOf, NgIf} from "@angular/common";
import {MatDivider} from "@angular/material/divider";
import { formatDistanceToNow } from 'date-fns';
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatError, MatFormField} from "@angular/material/form-field";
import {MatOption} from "@angular/material/autocomplete";
import {MatSelect} from "@angular/material/select";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatButton} from "@angular/material/button";

@Component({
  selector: 'app-detail-image',
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatCardSubtitle,
    MatCardTitle,
    MatChip,
    TablerIconsModule,
    DatePipe,
    MatDivider,
    NgForOf,
    MatProgressSpinner,
    NgIf,
    MatError,
    MatFormField,
    MatOption,
    MatSelect,
    ReactiveFormsModule,
    MatButton
  ],
  templateUrl: './detail-image.component.html',
  styleUrl: './detail-image.component.scss'
})
export class DetailImageComponent implements OnInit {
  imageId: number | null = null;
  imageDetails: any;
  loading: boolean = true;
  form: FormGroup;
  textTranslated: string = '';
  selectedLanguaje : any;
  languajes: { id: string, nombre: string }[] = [
    { id: 'ar', nombre: 'Árabe' },
    { id: 'zh', nombre: 'Chino (Simplificado)' },
    { id: 'zh-TW', nombre: 'Chino (Tradicional)' },
    { id: 'cs', nombre: 'Checo' },
    { id: 'da', nombre: 'Danés' },
    { id: 'nl', nombre: 'Neerlandés (Holandés)' },
    { id: 'en', nombre: 'Inglés' },
    { id: 'et', nombre: 'Estonio' },
    { id: 'fi', nombre: 'Finlandés' },
    { id: 'fr', nombre: 'Francés' },
    { id: 'de', nombre: 'Alemán' },
    { id: 'el', nombre: 'Griego' },
    { id: 'he', nombre: 'Hebreo' },
    { id: 'hi', nombre: 'Hindi' },
    { id: 'hu', nombre: 'Húngaro' },
    { id: 'id', nombre: 'Indonesio' },
    { id: 'it', nombre: 'Italiano' },
    { id: 'ja', nombre: 'Japonés' },
    { id: 'ko', nombre: 'Coreano' },
    { id: 'lv', nombre: 'Letón' },
    { id: 'no', nombre: 'Noruego' },
    { id: 'pl', nombre: 'Polaco' },
    { id: 'pt-BR', nombre: 'Portugués (Brasil)' },
    { id: 'pt-PT', nombre: 'Portugués (Portugal)' },
    { id: 'ro', nombre: 'Rumano' },
    { id: 'ru', nombre: 'Ruso' },
    { id: 'sk', nombre: 'Eslovaco' },
    { id: 'sl', nombre: 'Esloveno' },
    { id: 'es', nombre: 'Español' },
    { id: 'sv', nombre: 'Sueco' },
    { id: 'th', nombre: 'Tailandés' },
    { id: 'tr', nombre: 'Turco' },
    { id: 'uk', nombre: 'Ucraniano' },
    { id: 'vi', nombre: 'Vietnamita' }
  ];


  constructor(
    private route: ActivatedRoute,
    private imagesService: ImagesService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      languaje: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.imageId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.imageId) {
      this.imagesService.getImageById(this.imageId).subscribe(
        (response) => {
          console.log('Detalles de la imagen:', response);
          this.imageDetails = response;
          this.loading = false;
        },
        (error) => {
          console.error('Error:', error);
          this.loading = false;
        }
      );
    }
  }

  timeAgo(date: string) {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  }

  return(): void {
    window.history.back();
  }

  traslateText() {
    if (this.form.valid) {
      const selectedLanguajeId = this.form.get('languaje')?.value;
      this.selectedLanguaje = this.languajes.find(lang => lang.id === selectedLanguajeId);
      console.log('Selected Languaje:', this.selectedLanguaje);
      if(this.selectedLanguaje){
        this.imagesService.translateText(this.imageDetails.descripcion, this.selectedLanguaje.id).subscribe(
          (response) => {
            console.log('Texto traducido:', response);
            this.textTranslated = response.translatedText;
          },
          (error) => {
            console.error('Error:', error);
          });
      }else{
        console.error('Error: Lenguaje no encontrado');
      }
    }
  }
}
