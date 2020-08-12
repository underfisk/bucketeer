import { Pipe, PipeTransform } from '@angular/core';
import { CloudStorage } from '../../store/cloud-storage/cloud-storage.interface';
import { convertBytes } from '../../core/services/storage/file.utils';


@Pipe({name: 'spaceUsed'})
export class SpaceUsedPipe implements PipeTransform {
  transform(value: CloudStorage): string {
    return value.spaceUsed ?`${convertBytes(value.spaceUsed)} / ${value.maxSpace} GB` : `0 / ${value.maxSpace} GB`
  }
}
