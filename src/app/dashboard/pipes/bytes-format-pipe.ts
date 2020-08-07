import { Pipe, PipeTransform } from '@angular/core';
import { convertBytes } from '../../core/services/storage/file.utils';


@Pipe({name: 'bytesFormat'})
export class BytesFormatPipe implements PipeTransform {
  transform(value: number): string {
    return typeof value === 'number' ? convertBytes(value) : 'N/A'
  }
}
