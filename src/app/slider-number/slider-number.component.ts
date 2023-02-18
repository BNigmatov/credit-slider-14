import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef,
  forwardRef,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import {
  FormGroup,
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  FormControl,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'slider-number',
  templateUrl: './slider-number.component.html',
  styleUrls: ['slider-number.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderNumberComponent),
      multi: true,
    },
  ],
})
export class SliderNumberComponent
  implements OnInit, OnChanges, OnDestroy, ControlValueAccessor
{
  // @Input() value: number;
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;
  @Input() color: string;
  @Input() disabled: boolean;
  @Input() label: string;
  @Input() suffix: string;
  @Input()
  msgErrorMin: string = 'Меньше допустимого';
  @Input()
  msgErrorMax: string = 'Больше допустимого';
  // _control: NgControl;

  form: FormGroup;
  formInput: FormControl;
  formSlider: FormControl;

  private _unsubscribeAll$: Subject<any>;

  constructor(
    private _changeDetectorRef: ChangeDetectorRef // @Inject(INJECTOR) private injector: Injector,
  ) {
    this._unsubscribeAll$ = new Subject();

    this.formInput = new FormControl('');
    this.formSlider = new FormControl(0);

    this.form = new FormGroup({
      input: this.formInput,
      slider: this.formSlider,
    });

    this.formInput.valueChanges
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe((st) => {
        let num: number = this.stringToNumber(st);
        // if (this.min && num < this.min) {
        //   num = this.min;
        // }
        // if (this.max && num > this.max) {
        //   num = this.max;
        // }
        st = this.numberToString(num); // + (this.decimal && st.substr(st.length-1) === '.' ? '.' : '');
        if (st !== this.formInput.value) {
          this.formInput.setValue(st, { emitEvent: false });
        }
        // this.hidden = this.form.controls[ this.attrs.key ] as FormControl;
        // if (this.hidden.value !== num) {
        //   this.hidden.setValue( num );
        // }
        // this.formInput.setErrors(this.hidden.errors);

        this.onChange(num);
        this.formSlider.patchValue(num);
      });
  }

  ngOnInit(): void {
    // this._control = this.injector.get(NgControl);
    this.checkValidators();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next(true);
    this._unsubscribeAll$.complete();
    this._changeDetectorRef.detach();
    // this.stateChanges.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.min && changes.min.currentValue && !changes.min.firstChange) {
      this.min = changes.min.currentValue;
    }
    if (changes.max && changes.max.currentValue && !changes.max.firstChange) {
      this.max = changes.max.currentValue;
    }
    this.checkValidators();
    this.refresh();
  }

  checkValidators(): void {
    const validators: any[] = [
      this.validatorCheckMinMaxValidator(this.min, this.max),
    ];
    this.formInput.setValidators(validators);
  }

  onChange = (delta: any) => {
    console.log('onChange:', delta);
  };

  onTouched = () => {
    // this.touched = true;
  };
  writeValue(value: number): void {
    this.formInput.patchValue(value);
    this.refresh();
  }
  registerOnChange(fn: (v: any) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  refresh(): void {
    this._changeDetectorRef.markForCheck();
  }

  changeSlider(event: any): void {
    // this.value = event.value;
    this.formInput.patchValue(event.value);
  }

  private numberToString(num: number): string {
    if (num === null) {
      return '';
    }
    const [integer, decimal] = ('' + num).split('.');
    let st: string = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    // if (this.decimal && decimal) {
    //   st = st.concat('.', decimal.substr(0,this.decimal));
    // }
    return st;
  }

  private stringToNumber(st: string): number {
    const regExp = new RegExp('[^\\d.-]', 'g');
    const [integer, decimal] = ('' + st).replace(regExp, '').split('.');
    let num: number = Number(integer) || 0;
    // if (this.decimal && decimal) {
    //   num = Number( integer.concat('.', decimal.substr(0,this.decimal)) );
    // }
    return num;
  }

  validatorCheckMinMaxValidator(min?: number, max?: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const num: number = this.stringToNumber(control.value);
      return num < min || 0 || (max > 0 && num > max)
        ? { forbiddenMinMax: { value: control.value } }
        : null;
    };
  }
}
