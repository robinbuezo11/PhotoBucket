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
    NgIf
  ],
  templateUrl: './detail-image.component.html',
  styleUrl: './detail-image.component.scss'
})
export class DetailImageComponent implements OnInit {
  imageId: number | null = null;
  imageDetails: any;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private imagesService: ImagesService
  ) {
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

}
