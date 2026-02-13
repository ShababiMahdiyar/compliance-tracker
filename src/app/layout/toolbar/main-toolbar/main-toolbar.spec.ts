import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MainToolbar } from './main-toolbar';

describe('MainToolbar', () => {
  let component: MainToolbar;
  let fixture: ComponentFixture<MainToolbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainToolbar],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MainToolbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
