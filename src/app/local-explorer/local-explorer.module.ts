import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { AuthService } from '../core/services/auth-service/auth.service';
import { StorageService } from '../core/services/storage/storage.service'
import { MaterialModule } from '../shared/material.module';
import { ContextMenuModule } from 'ngx-contextmenu';
import { NgxImageZoomModule } from 'ngx-image-zoom';
import { LocalExplorerComponent} from './local-explorer.component'
import { BytesFormatPipe } from '../dashboard/pipes/bytes-format-pipe'
@NgModule({
  declarations: [LocalExplorerComponent, BytesFormatPipe],
  imports: [CommonModule, SharedModule, MaterialModule,  ContextMenuModule.forRoot({ autoFocus:  true}), NgxImageZoomModule],
  providers: [AuthService, StorageService],
  entryComponents: [LocalExplorerComponent]
})
export class LocalExplorerModule {}
