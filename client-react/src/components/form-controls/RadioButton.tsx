import {
  IChoiceGroupOption,
  IChoiceGroupOptionStyleProps,
  IChoiceGroupOptionStyles,
  IChoiceGroupProps,
  IStyleFunctionOrObject,
} from '@fluentui/react';
import { FieldProps } from 'formik';
import { useCallback } from 'react';
import { ChoiceGroupStyles, ChoiceGroupVerticalStyles } from '../../theme/CustomOfficeFabric/AzurePortal/ChoiceGroup.styles';
import RadioButtonNoFormik from './RadioButtonNoFormik';
import { formikOnBlur } from '../../pages/app/deployment-center/utility/DeploymentCenterUtility';

interface RadioButtonProps {
  id: string;
  label: string;
  dirty?: boolean;
  displayInVerticalLayout?: boolean;
  learnMore?: {
    learnMoreLink: string;
    learnMoreText: string;
  };
  optionStyles?: IStyleFunctionOrObject<IChoiceGroupOptionStyleProps, IChoiceGroupOptionStyles>;
  subLabel?: string;
  upsellMessage?: string;
}

const RadioButton: React.FC<IChoiceGroupProps & FieldProps & RadioButtonProps> = (
  props: IChoiceGroupProps & FieldProps & RadioButtonProps
) => {
  const { field, form, meta, options, theme, displayInVerticalLayout, ...rest } = props;

  const onChange = useCallback(
    (_: React.FormEvent<HTMLElement>, option?: IChoiceGroupOption) => {
      form.setFieldValue(field.name, option?.key);
    },
    [field.name, form]
  );

  return (
    <RadioButtonNoFormik
      ariaLabelledBy={`${props.id}-label`}
      onBlur={e => formikOnBlur(e, { field, form, meta })}
      onChange={onChange}
      options={options}
      selectedKey={field.value}
      styles={displayInVerticalLayout ? ChoiceGroupVerticalStyles : ChoiceGroupStyles}
      {...rest}
    />
  );
};

export default RadioButton;
