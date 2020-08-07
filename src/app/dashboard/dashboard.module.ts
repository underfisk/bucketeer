import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';

import { DashboardComponent } from './dashboard.component';
import { SharedModule } from '../shared/shared.module';
import { AuthService } from '../core/services/auth-service/auth.service';
import { StorageService } from '../core/services/storage/storage.service'
import { MaterialModule } from 'app/shared/material.module';
import { SpaceUsedPipe } from './pipes/space-used-pipe'
import { CloudExplorerModule } from '../cloud-explorer/cloud-explorer.module'
import { LocalExplorerModule } from '../local-explorer/local-explorer.module'
import { ContextMenuModule } from 'ngx-contextmenu';
import { PreviewImageDialog } from '../dialogs/preview-image-dialog/preview-image-dialog';
import { RenameFileNameDialog } from '../dialogs/rename-file-dialog/rename-file.component';
import { NgxImageZoomModule } from 'ngx-image-zoom';

@NgModule({
  declarations: [DashboardComponent, SpaceUsedPipe, RenameFileNameDialog, PreviewImageDialog],
  imports: [CommonModule, SharedModule, DashboardRoutingModule,LocalExplorerModule,CloudExplorerModule, MaterialModule,  ContextMenuModule.forRoot({ autoFocus:  true}), NgxImageZoomModule],
  providers: [AuthService, StorageService],
  entryComponents: [DashboardComponent, RenameFileNameDialog, PreviewImageDialog]
})
export class DashboardModule {}
