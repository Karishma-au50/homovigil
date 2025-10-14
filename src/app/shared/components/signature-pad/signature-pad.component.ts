import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit, forwardRef, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import SignaturePad from 'signature_pad';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule,ToastModule, ButtonModule],
  template: `
    <div class="signature-pad-container">
      <div class="signature-pad-header" *ngIf="label">
        <label class="block text-muted-color mb-2 font-medium">{{ label }}</label>
      </div>
      <div class="signature-pad-wrapper" [class.has-error]="hasError">
        <button
          type="button"
          class="clear-icon-btn"
          (click)="clear()"
          [disabled]="disabled || isEmpty()"
          *ngIf="!isEmpty()"
          title="Clear signature">
          <i class="pi pi-times"></i>
        </button>
        <canvas
          #canvas
          class="signature-canvas"
          [width]="width"
          [height]="height">
        </canvas>
      </div>

      <p-toast [showTransitionOptions]="'250ms'" [showTransformOptions]="'translateX(100%)'" [hideTransitionOptions]="'150ms'" [hideTransformOptions]="'translateX(100%)'" />
    </div>
  `,
  styleUrls: ['./signature-pad.component.scss'],
  providers: [
    MessageService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SignaturePadComponent),
      multi: true
    }
  ]
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
    constructor(private messageService: MessageService) {}

    // show() {
    //     this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Message Content' });
    // }

  @ViewChild('canvas', { static: true }) canvasEl!: ElementRef<HTMLCanvasElement>;

  @Input() width: number = 400;
  @Input() height: number = 200;
  @Input() label: string = '';
  @Input() placeholder: string = 'Please sign here';
  @Input() disabled: boolean = false;
  @Input() hasError: boolean = false;

  @Output() onSave = new EventEmitter<string>();
  @Output() onClear = new EventEmitter<void>();

  private signaturePad!: SignaturePad;
  private onChange = (value: string) => {};
  private onTouched = () => {};
  private pendingValue: string | null = null;

  ngAfterViewInit() {
    this.initializeSignaturePad();
    if (this.pendingValue !== null) {
      this.writeValue(this.pendingValue);
      this.pendingValue = null;
    }
  }

  ngOnDestroy() {
    if (this.signaturePad) {
      this.signaturePad.off();
    }
  }

  private initializeSignaturePad() {
    this.signaturePad = new SignaturePad(this.canvasEl.nativeElement, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: '#000000',
      minWidth: 1,
      maxWidth: 3,
      throttle: 16,
      minDistance: 3,
    });

    // Emit changes when signature changes
    this.signaturePad.addEventListener('endStroke', () => {
      const dataURL = this.signaturePad.toDataURL();
      this.onChange(dataURL);
      this.onTouched();

      // Auto-save signature when user finishes drawing
    //   this.autoSave();
    });

    // Handle disabled state
    if (this.disabled) {
      this.signaturePad.off();
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    if (this.signaturePad) {
      if (value) {
        this.signaturePad.fromDataURL(value);
      } else {
        this.signaturePad.clear();
      }
    } else {
      this.pendingValue = value;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.signaturePad) {
      if (isDisabled) {
        this.signaturePad.off();
      } else {
        this.signaturePad.on();
      }
    }
  }

  // Public methods
  clear(): void {
    if (this.signaturePad) {
      this.signaturePad.clear();
      this.onChange('');
      this.onClear.emit();
    }
  }

  save(): void {
    if (this.signaturePad && !this.isEmpty()) {
      const dataURL = this.signaturePad.toDataURL();
      this.onSave.emit(dataURL);
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Signature saved successfully!' });
    }
  }

  private autoSave(): void {
    if (this.signaturePad && !this.isEmpty()) {
      const dataURL = this.signaturePad.toDataURL();
      this.onSave.emit(dataURL);
      // Show a subtle success message for auto-save
      this.messageService.add({
        severity: 'success',
        summary: 'Auto-saved',
        detail: 'Signature saved automatically!',
        life: 2000
      });
    }
  }

  isEmpty(): boolean {
    return this.signaturePad ? this.signaturePad.isEmpty() : true;
  }

  getDataURL(type: string = 'image/png'): string {
    return this.signaturePad ? this.signaturePad.toDataURL(type) : '';
  }

  fromDataURL(dataURL: string): void {
    if (this.signaturePad) {
      this.signaturePad.fromDataURL(dataURL);
    }
  }
}
