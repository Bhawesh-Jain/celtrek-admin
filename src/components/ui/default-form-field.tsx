import DatePicker from "../date-picker";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "./select";
import { Textarea } from "./textarea";
import { Checkbox } from "./checkbox";

export function DefaultFormCheckbox({
  label,
  name,
  description = "",
  disabled = false,
  form,
  className,
}: {
  label: string;
  name: string;
  description?: string;
  disabled?: boolean;
  form: any;
  className?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={`flex flex-row items-start space-x-3 space-y-0 ${className}`}>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="cursor-pointer">
              {label}
            </FormLabel>
            {description && (
              <FormDescription>
                {description}
              </FormDescription>
            )}
          </div>
        </FormItem>
      )}
    />
  );
}

export function DefaultFormCheckboxGroup({
  label,
  name,
  options,
  description = "",
  disabled = false,
  form,
  className,
  orientation = "vertical" as "vertical" | "horizontal",
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  description?: string;
  disabled?: boolean;
  form: any;
  className?: string;
  orientation?: "vertical" | "horizontal";
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem className={className}>
          <div>
            <FormLabel>{label}</FormLabel>
            {description && (
              <FormDescription>
                {description}
              </FormDescription>
            )}
          </div>
          <div className={`flex ${orientation === "horizontal" ? "flex-row gap-4 flex-wrap" : "flex-col gap-2"} mt-2`}>
            {options.map((option) => (
              <FormField
                key={option.value}
                control={form.control}
                name={name}
                render={({ field }) => {
                  return (
                    <FormItem
                      key={option.value}
                      className="flex flex-row items-start space-x-2 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={Array.isArray(field.value) ? field.value.includes(option.value) : field.value === option.value}
                          onCheckedChange={(checked) => {
                            if (Array.isArray(field.value)) {
                              const updatedValue = checked
                                ? [...field.value, option.value]
                                : field.value.filter((value: string) => value !== option.value);
                              field.onChange(updatedValue);
                            } else {
                              field.onChange(checked ? option.value : undefined);
                            }
                          }}
                          disabled={disabled}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        {option.label}
                      </FormLabel>
                    </FormItem>
                  );
                }}
              />
            ))}
          </div>
        </FormItem>
      )}
    />
  );
}
export function DefaultFormTextField({
  label,
  name,
  placeholder = '',
  step = '',
  type,
  uppercase = false,
  disabled = false,
  capitalize = true,
  form
}: {
  label?: string,
  name: string,
  step?: string,
  type?: string,
  placeholder?: string,
  uppercase?: boolean,
  disabled?: boolean,
  capitalize?: boolean,
  form: any
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Input
              disabled={disabled}
              placeholder={placeholder} 
              step={step}
              {...field}
              type={type}
              value={field.value || ''}
              onChange={(e) => {
                const value = uppercase
                  ? e.target.value.toUpperCase()
                  : e.target.value;
                field.onChange(value);
              }}
              autoCapitalize={capitalize ? "sentences" : "off"}
              onInput={uppercase ? (e) => {
                e.currentTarget.value = e.currentTarget.value.toUpperCase()
              } : undefined}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}


export function DefaultFormTimeField({
  label,
  name,
  placeholder,
  form
}: {
  label: string,
  name: string,
  placeholder?: string,
  form: any
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type="time" placeholder={placeholder} {...field} autoCapitalize="characters"/>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
};

export function DefaultFormTextArea({
  label,
  name,
  placeholder,
  disabled = false,
  form,
  className,
  rows = 3
}: {
  label?: string,
  name: string,
  placeholder?: string,
  rows?: number,
  className?: string,
  form: any,
  disabled?: boolean
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Textarea placeholder={placeholder} disabled={disabled} className={className} {...field} rows={rows} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
};


export function DefaultFormSelect({
  label,
  name,
  placeholder = '',
  options,
  disabled,
  form,
}: {
  label: string,
  name: string,
  options: any[],
  placeholder?: string,
  disabled?: boolean,
  form: any,
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Select
              onValueChange={field.onChange}
              value={String(field.value)}
              defaultValue={String(field.value)}
              form={form}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
};

export function DefaultFormDatePicker({
  label,
  name,
  form,
  subYear = 0,
  minToday = false,
  maxToday = false,
}: {
  label: string;
  name: string;
  form: any;
  subYear?: number;
  minToday?: boolean;
  maxToday?: boolean;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <DatePicker
              date={field.value || null}
              minToday={minToday}
              maxToday={maxToday}
              subYear={subYear}
              onChange={(date) => field.onChange(date)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}