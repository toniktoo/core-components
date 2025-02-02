import React, { forwardRef, useState, useEffect, useCallback, ChangeEvent, useRef } from 'react';
import cn from 'classnames';

import mergeRefs from 'react-merge-refs';
import { AsYouType, CountryCode } from 'libphonenumber-js';

import { Input, InputProps } from '@alfalab/core-components-input';
import { SelectProps } from '@alfalab/core-components-select';
import { getCountries, getCountriesHash } from '@alfalab/utils';

import { CountriesSelect } from './components';

import styles from './index.module.css';

const countries = getCountries();
const countriesHash = getCountriesHash();

const MAX_DIAL_CODE_LENGTH = 4;

export type IntlPhoneInputProps = Omit<InputProps, 'value' | 'onChange' | 'type' | 'defaultValue'> &
    Pick<SelectProps, 'preventFlip'> & {
        /**
         * Значение
         */
        value: string;

        /**
         * Обработчик события изменения значения
         */
        onChange: (value: string) => void;

        /**
         * Дефолтный код страны
         */
        defaultCountryIso2?: string;

        /**
         * Обработчик события изменения страны
         */
        onCountryChange?: (countryCode: CountryCode) => void;
    };

export const IntlPhoneInput = forwardRef<HTMLInputElement, IntlPhoneInputProps>(
    (
        {
            disabled = false,
            readOnly = false,
            size = 'm',
            className,
            value,
            onChange,
            onCountryChange,
            defaultCountryIso2 = 'ru',
            preventFlip,
            ...restProps
        },
        ref,
    ) => {
        const [countryIso2, setCountryIso2] = useState(defaultCountryIso2.toLowerCase());

        const inputRef = useRef<HTMLInputElement>(null);
        const inputWrapperRef = useRef<HTMLDivElement>(null);

        const phoneLibUtils = useRef<typeof AsYouType>();

        const setCountryByIso2 = useCallback(
            (iso2: string) => {
                const country = countriesHash[iso2];

                const inputValue = `+${country.dialCode}`;

                onChange(inputValue);
                setCountryIso2(country.iso2);

                return country;
            },
            [onChange],
        );

        const setValue = useCallback(
            inputValue => {
                let newValue = inputValue;

                if (phoneLibUtils.current) {
                    const Utils = phoneLibUtils.current;
                    const utils = new Utils(countryIso2.toUpperCase() as CountryCode);

                    newValue = utils.input(inputValue);
                }

                onChange(newValue);
            },
            [onChange, countryIso2],
        );

        const handleCountryChange = useCallback(
            (countryCode: string) => {
                if (onCountryChange) {
                    onCountryChange(countryCode.toUpperCase() as CountryCode);
                }
            },
            [onCountryChange],
        );

        const setCountryByDialCode = useCallback(
            inputValue => {
                for (let i = 0; i < countries.length; i++) {
                    const country = countries[i];

                    if (new RegExp(`^\\+${country.dialCode}`).test(inputValue)) {
                        // Сначала проверяем, если приоритет не указан
                        if (country.priority === undefined) {
                            setValue(inputValue);
                            setCountryIso2(country.iso2);
                            handleCountryChange(country.iso2);

                            break;
                        }

                        // Если страна уже была выставлена через селект, и коды совпадают
                        if (countryIso2 === country.iso2) {
                            setValue(inputValue);
                            setCountryIso2(country.iso2);
                            handleCountryChange(country.iso2);

                            break;
                            // Если не совпадают - выбираем по приоритету
                        } else if (country.priority === 0) {
                            setValue(inputValue);
                            setCountryIso2(country.iso2);
                            handleCountryChange(country.iso2);

                            break;
                        }
                    }
                }
            },
            [countryIso2, setValue, handleCountryChange],
        );

        const loadPhoneUtils = useCallback(() => {
            // prettier-ignore
            return import(/* webpackChunkName: "libphonenumber" */ 'libphonenumber-js/bundle/libphonenumber-js.min')
                .then(utils => {
                    phoneLibUtils.current = utils.AsYouType;
                })
                .catch(error => `An error occurred while loading libphonenumber-js:\n${error}`);
        }, []);

        const handleInputChange = useCallback(
            (event: ChangeEvent<HTMLInputElement>) => {
                const {
                    target: { value: targetValue },
                } = event;

                const newValue =
                    targetValue.length === 1 && targetValue !== '+'
                        ? `+${targetValue}`
                        : targetValue;

                setValue(newValue);

                if (value.length < MAX_DIAL_CODE_LENGTH) {
                    setCountryByDialCode(newValue);
                }
            },
            [setValue, setCountryByDialCode, value.length],
        );

        const handleSelectChange = useCallback<Required<SelectProps>['onChange']>(
            ({ selected }) => {
                if (selected) {
                    const country = setCountryByIso2(selected.value);
                    const inputValue = `+${country.dialCode}`;

                    if (inputRef.current) {
                        inputRef.current.focus();
                        inputRef.current.setSelectionRange(inputValue.length, inputValue.length);
                    }

                    handleCountryChange(country.iso2);
                }
            },
            [setCountryByIso2, handleCountryChange],
        );

        useEffect(() => {
            if (!phoneLibUtils.current) {
                loadPhoneUtils().then(() => {
                    setCountryByDialCode(value);
                });
            }
        }, [loadPhoneUtils, setCountryByDialCode, value]);

        return (
            <Input
                {...restProps}
                onChange={handleInputChange}
                value={value}
                type='tel'
                ref={mergeRefs([inputRef, ref])}
                wrapperRef={inputWrapperRef}
                className={cn(className, styles[size])}
                addonsClassName={styles.addons}
                size={size}
                disabled={disabled}
                readOnly={readOnly}
                leftAddons={
                    <CountriesSelect
                        disabled={disabled || readOnly}
                        size={size}
                        selected={countryIso2}
                        countries={countries}
                        onChange={handleSelectChange}
                        fieldWidth={
                            inputWrapperRef.current &&
                            inputWrapperRef.current.getBoundingClientRect().width
                        }
                        preventFlip={preventFlip}
                    />
                }
            />
        );
    },
);

IntlPhoneInput.defaultProps = {
    size: 'm',
    defaultCountryIso2: 'ru',
};
