import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalExplorerComponent } from './local-explorer.component';

describe('LocalExplorerComponent', () => {
  let component: LocalExplorerComponent;
  let fixture: ComponentFixture<LocalExplorerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LocalExplorerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocalExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
