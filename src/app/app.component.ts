import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

export const CREDIT_OSON_COMMERCE_PRICE_TOSHKENT = 416_500_000; // 339_150_000; Тошкент шахарда
export const CREDIT_OSON_COMMERCE_PRICE_CITY = 327_250_000; // 309_400_000; Вилоят шаҳарларда
export const CREDIT_OSON_COMMERCE_PRICE_REGION = 327_250_000; // 238_000_000; Қишлоқ жойларда

export const CREDIT_OSON_COMMERCE_INITIAL = 15;
export const CREDIT_OSON_COMMERCE_INITIAL_SUBSIDY = 15;

export const CREDIT_OSON_COMMERCE_PERCENTAGE = 18;

@Component({
  selector: 'app-credit-form',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  form: FormGroup;

  calc: any;

  selectedMinInitial: number = CREDIT_OSON_COMMERCE_PERCENTAGE;
  selectedSummaMax: number = CREDIT_OSON_COMMERCE_PRICE_REGION;
  summaMax: number = CREDIT_OSON_COMMERCE_PRICE_REGION;
  initialMin: number = 0;
  initialMinPercentage: number = CREDIT_OSON_COMMERCE_PERCENTAGE;

  private emitEvent: boolean = true;

  constructor() {
    this.form = new FormGroup({
      location: new FormControl('', [Validators.required]),
      is_subsidy: new FormControl(false),
      credit_ammount: new FormControl(100_000_000, [Validators.required]),
      credit_summa: new FormControl(10_000_000, [Validators.required]),
      initial_recommend: new FormControl(CREDIT_OSON_COMMERCE_PERCENTAGE, [
        Validators.required,
      ]),
      initial_ammount: new FormControl(0, [Validators.required]),
      credit_period: new FormControl(20, [Validators.required]),
    });

    this.form.controls.location.valueChanges.subscribe((location) => {
      if (location === 'tashkent') {
        this.selectedSummaMax = CREDIT_OSON_COMMERCE_PRICE_TOSHKENT;
      } else {
        this.selectedSummaMax = CREDIT_OSON_COMMERCE_PRICE_REGION;
      }
      this.recalc();
    });

    this.form.controls.is_subsidy.valueChanges.subscribe((value) => {
      // this.selectedMinInitial = value ? CREDIT_OSON_COMMERCE_PERCENTAGE_SUBSIDY : CREDIT_OSON_COMMERCE_PERCENTAGE;
      this.selectedMinInitial = value
        ? CREDIT_OSON_COMMERCE_INITIAL_SUBSIDY
        : CREDIT_OSON_COMMERCE_INITIAL;
      this.recalc();
    });

    this.form.controls.credit_ammount.valueChanges.subscribe((value) => {
      this.recalc('credit_ammount', value);
    });

    this.form.controls.credit_summa.valueChanges.subscribe((value) => {
      this.recalc('credit_summa', value);
    });

    this.form.controls.initial_ammount.valueChanges.subscribe((value) => {
      this.recalc('initial_ammount', value);
    });

    this.form.controls.initial_recommend.valueChanges.subscribe((value) => {
      this.recalc('initial_recommend', value);
    });

    this.form.controls.credit_period.valueChanges.subscribe((value) => {
      this.recalc('credit_period', value);
    });
  }

  recalc(changedField?: string, value?: number): void {
    if (!this.emitEvent) {
      return;
    }
    const formValue: any = this.form.value;
    if (changedField) {
      formValue[changedField] = value;
    }
    const patchValue: any = {} as any;

    if (!changedField || changedField === 'credit_ammount') {
      this.initialMin =
        (formValue.credit_ammount * this.selectedMinInitial) / 100;
      if (formValue.credit_ammount - this.initialMin > this.selectedSummaMax) {
        this.initialMin = formValue.credit_ammount - this.selectedSummaMax;
      }
      this.initialMinPercentage = Math.ceil(
        (this.initialMin * 100) / formValue.credit_ammount
      );
      this.summaMax =
        this.selectedSummaMax < formValue.credit_ammount - this.initialMin
          ? this.selectedSummaMax
          : formValue.credit_ammount - this.initialMin;
    }

    if (changedField !== 'initial_recommend') {
      // Первоначальный процент взноса
      if (formValue.initial_recommend > 100) {
        patchValue.initial_recommend = 100;
      } else if (formValue.initial_recommend < this.initialMinPercentage) {
        patchValue.initial_recommend = this.initialMinPercentage;
      }
    }

    if (changedField !== 'initial_ammount') {
      // Первоначальная сумма взноса
      if (formValue.initial_ammount > formValue.credit_ammount - 1_000_000) {
        patchValue.initial_ammount = formValue.credit_ammount - 1_000_000;
      } else if (formValue.initial_ammount < this.initialMin) {
        patchValue.initial_ammount = this.initialMin;
      }
    }

    if (changedField !== 'credit_summa') {
      if (formValue.credit_summa > this.summaMax) {
        patchValue.credit_summa = this.summaMax;
      }
    }

    if (changedField === 'initial_recommend' || patchValue.initial_recommend) {
      // Первоначальный процент взноса
      patchValue.initial_ammount =
        (formValue.credit_ammount *
          (patchValue.initial_recommend || formValue.initial_recommend)) /
        100;
      patchValue.credit_summa =
        formValue.credit_ammount -
        (patchValue.initial_ammount || formValue.initial_ammount);
    }
    if (changedField === 'initial_ammount' || patchValue.initial_ammount) {
      // Первоначальная сумма взноса
      patchValue.initial_recommend =
        ((patchValue.initial_ammount || formValue.initial_ammount) * 100) /
        formValue.credit_ammount;
      patchValue.credit_summa =
        formValue.credit_ammount -
        (patchValue.initial_ammount || formValue.initial_ammount);
    }
    if (changedField === 'credit_summa') {
      // Сумма кредита
      patchValue.initial_recommend =
        ((formValue.credit_ammount -
          (patchValue.credit_summa || formValue.credit_summa)) *
          100) /
        formValue.credit_ammount;
      patchValue.initial_ammount =
        formValue.credit_ammount -
        (patchValue.credit_summa || formValue.credit_summa);
    }

    if (
      patchValue.initial_recommend &&
      patchValue.initial_recommend < this.initialMinPercentage
    ) {
      patchValue.initial_recommend = this.initialMinPercentage;
    }
    if (
      patchValue.initial_ammount &&
      patchValue.initial_ammount < this.initialMin
    ) {
      patchValue.initial_ammount = this.initialMin;
    } else if (
      patchValue.initial_ammount &&
      patchValue.initial_ammount > formValue.credit_ammount - 1_000_000
    ) {
      patchValue.initial_ammount = formValue.credit_ammount - 1_000_000;
    }
    if (patchValue.credit_summa && patchValue.credit_summa > this.summaMax) {
      patchValue.credit_summa = this.summaMax;
    }

    this.emitEvent = false;
    this.form.patchValue(patchValue, { emitEvent: false });
    this.emitEvent = true;

    this.calculate();
  }

  ngOnInit(): void {
    this.recalc();
  }

  calculate(): void {
    const formValues: any = this.form.getRawValue();
    const action: any = {
      credit: {
        ...formValues,
        credit_period: formValues.credit_period * 12, // Переводим с лет на мес.
        credit_percentage: CREDIT_OSON_COMMERCE_PERCENTAGE,
        schedule: 'annuitet',
      },
    } as any;
    // const actionPatch = actionCreditPatchsOnChanges( action, 'credit', {
    //   initial_percent: this.initialMinPercentage,
    // });
    // this.calc = actionPatch.credit;
    // this.calc.sum_subsidy = this.calc.sum_credit - (action.credit.credit_summa * (action.credit.credit_percentage - 10) / 100) / 12;

    // this.scoring.result.req_salary_subsidy = this.calc.sum_subsidy / 0.7;
  }
}
