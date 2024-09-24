import { Component, Input, Output, EventEmitter, ViewEncapsulation, OnInit, inject, model, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UsersService } from 'src/app/services/users.service';  // Asegúrate de importar el servicio
import { Router } from '@angular/router';
import { DialogComponentComponent } from 'src/app/pages/extra/dialog-component/dialog-component.component'; // Asegúrate de importar el componente

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  showFiller = false;
  userData: any = null;

  readonly animal = signal('');
  readonly name = model('');
  constructor(
    private dialog: MatDialog, 
    private usersService: UsersService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      this.userData = JSON.parse(userData);
    } else {
      console.log('Datos del usuario no encontrados');
    }

    this.usersService.userData$.subscribe((data: any) => {
      this.userData = data;
    });

  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/authentication/login']);
  }

  openDialog() {
    const dialogRef = this.dialog.open(DialogComponentComponent, {
      data: { name: this.userData ? this.userData.usuario : '', id: this.userData ? this.userData.id : '' },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        console.log('Result from dialog:', result);
      }
    });
  }
}

