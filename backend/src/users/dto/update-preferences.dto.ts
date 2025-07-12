import { IsOptional, IsString, IsNumber, IsObject, Min, Max } from 'class-validator';

export class TaxSettingsDto {
  @IsOptional()
  @IsObject()
  stock?: {
    capitalGainsTax?: number;
    dividendTax?: number;
  };

  @IsOptional()
  @IsObject()
  deposit?: {
    interestTax?: number;
  };

  @IsOptional()
  @IsObject()
  preciousMetal?: {
    capitalGainsTax?: number;
  };

  @IsOptional()
  @IsObject()
  recurringIncome?: {
    incomeTax?: number;
  };

  @IsOptional()
  @IsObject()
  crypto?: {
    capitalGainsTax?: number;
  };

  @IsOptional()
  @IsObject()
  realEstate?: {
    capitalGainsTax?: number;
    rentalIncomeTax?: number;
  };

  @IsOptional()
  @IsObject()
  bonds?: {
    interestTax?: number;
    capitalGainsTax?: number;
  };

  @IsOptional()
  @IsObject()
  cash?: {
    interestTax?: number;
  };
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsString()
  numberFormat?: string;

  @IsOptional()
  @IsObject()
  taxSettings?: TaxSettingsDto;
} 