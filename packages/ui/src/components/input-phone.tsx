'use client'

// @see https://shadcn-phone-input.vercel.app/
// @see https://www.npmjs.com/package/react-phone-number-input/v/3.3.6
// to validate: phone: z.string().refine(isPossiblePhoneNumber, { message: "Invalid phone number" })
import * as React from 'react'

import { CheckIcon, ChevronsUpDown } from 'lucide-react'
import * as RPNInput from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'

import { Button } from '@workspace/ui/components/button'
import { ButtonGroup } from '@workspace/ui/components/button-group'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@workspace/ui/components/command'
import { Input } from '@workspace/ui/components/input'
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { cn } from '@workspace/ui/lib/utils'

export {
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
  getCountryCallingCode,
} from 'react-phone-number-input'

type InputPhoneProps = Omit<React.ComponentProps<'input'>, 'onChange' | 'value' | 'ref'> &
  Omit<RPNInput.Props<typeof RPNInput.default>, 'onChange'> & {
    onChange?: (value: RPNInput.Value) => void
  }

const InputPhone = ({ onChange, value, className, ...props }: InputPhoneProps) => {
  return (
    <div data-slot="input-phone" role="group" className={cn(className)}>
      <RPNInput.default
        value={value ?? undefined}
        flagComponent={FlagComponent}
        countrySelectComponent={CountryComboboxComponent}
        inputComponent={Input}
        containerComponent={ButtonGroup}
        smartCaret={false}
        placeholder="Phone number"
        className={cn('w-full', className)}
        /**
         * Handles the onChange event.
         *
         * react-phone-number-input might trigger the onChange event as undefined
         * when a valid phone number is not entered. To prevent this,
         * the value is coerced to an empty string.
         *
         * @param value - (E164Number | undefined) The entered value
         */
        onChange={(value) => onChange?.(value ?? ('' as RPNInput.Value))}
        {...props}
      />
    </div>
  )
}

type CountryEntry = { label: string; value: RPNInput.Country | undefined }

type CountryComboboxComponentProps = {
  disabled?: boolean
  value: RPNInput.Country
  options: Array<CountryEntry>
  onChange: (country: RPNInput.Country) => void
}

const CountryComboboxComponent = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
}: CountryComboboxComponentProps) => {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Popover
      open={isOpen}
      modal={true}
      onOpenChange={(open) => {
        setIsOpen(open)
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="justify-between focus:z-10"
            disabled={disabled}
            aria-label={`Select country, currently ${selectedCountry}`}
          />
        }
      >
        <FlagComponent country={selectedCountry} countryName={selectedCountry} />
        <ChevronsUpDown className={cn('opacity-75')} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            onValueChange={() => {
              setTimeout(() => {
                if (scrollAreaRef.current) {
                  const viewportElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
                  if (viewportElement) {
                    viewportElement.scrollTop = 0
                  }
                }
              }, 0)
            }}
            placeholder="Search country..."
          />
          <CommandList>
            <ScrollArea ref={scrollAreaRef} className="h-72">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countryList.map(({ value, label }) =>
                  value ? (
                    <CommandItem
                      key={value}
                      value={`${label} ${value}`}
                      onSelect={() => {
                        onChange(value)
                        setIsOpen(false)
                      }}
                    >
                      <FlagComponent country={value} countryName={label} />
                      <span className="flex-1 text-sm">{label}</span>
                      <span className="text-sm text-foreground/50">{`+${RPNInput.getCountryCallingCode(value)}`}</span>
                      <CheckIcon
                        className={`ml-auto size-4 ${value === selectedCountry ? 'opacity-100' : 'opacity-0'}`}
                        aria-hidden="true"
                      />
                    </CommandItem>
                  ) : null,
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country]

  return (
    <span
      className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg:not([class*='size-'])]:size-full"
      aria-hidden="true"
    >
      {Flag && <Flag title={countryName} />}
    </span>
  )
}

export { InputPhone }
