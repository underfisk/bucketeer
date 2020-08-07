import { Pipe, PipeTransform } from '@angular/core';
import { CloudStorage } from 'app/store/cloud-storage/cloud-storage.interface';
import { convertBytes } from 'app/core/services/storage/file.utils';


@Pipe({name: 'spaceUsed'})
export class SpaceUsedPipe implements PipeTransform {
  transform(value: CloudStorage): string {
    return `${convertBytes(value.spaceUsed)} / ${value.maxSpace} GB`
  }
}
