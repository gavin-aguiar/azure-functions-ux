import { Field, FormikProps } from 'formik';
import React, { useContext, useState, useEffect, useMemo } from 'react';
import Dropdown from '../../../../../components/form-controls/DropDown';
import { AppSettingsFormValues } from '../../AppSettings.types';
import { PermissionsContext } from '../../Contexts';
import TextField from '../../../../../components/form-controls/TextField';
import { useTranslation } from 'react-i18next';
import { ScenarioService } from '../../../../../utils/scenario-checker/scenario.service';
import { ScenarioIds } from '../../../../../utils/scenario-checker/scenario-ids';
import { Links } from '../../../../../utils/FwLinks';
import DropdownNoFormik from '../../../../../components/form-controls/DropDownnoFormik';
import {
  getRuntimeStacks,
  getSelectedRuntimeStack,
  getSelectedMajorVersion,
  getSelectedMinorVersion,
  getMajorVersions,
  getMinorVersions,
  LINUXJAVASTACKKEY,
  isJavaStackSelected,
} from './LinuxStacks.data';
import JavaStack from './JavaStack';
import {
  filterDeprecatedWebAppStack,
  getEarlyStackMessageParameters,
  checkAndGetStackEOLOrDeprecatedBanner,
  isStackVersionDeprecated,
  isStackVersionEndOfLife,
} from '../../../../../utils/stacks-utils';
import { SiteStateContext } from '../../../../../SiteState';
import useStacks from '../../Hooks/useStacks';
import { CommonConstants } from '../../../../../utils/CommonConstants';

type PropsType = FormikProps<AppSettingsFormValues>;

const LinuxStacks: React.FC<PropsType> = props => {
  const { values, setFieldValue, initialValues } = props;
  const { site } = values;
  const { app_write, editable, saving } = useContext(PermissionsContext);
  const disableAllControls = !app_write || !editable || saving;

  const { webAppStacks, stackVersionDetails } = useStacks(initialValues.config.properties.linuxFxVersion);
  const siteStateContext = useContext(SiteStateContext);
  const { t } = useTranslation();
  const scenarioService = new ScenarioService(t);

  const [runtimeStack, setRuntimeStack] = useState<string | undefined>(undefined);
  const [majorVersionRuntime, setMajorVersionRuntime] = useState<string | null>(null);
  const [earlyAccessInfoVisible, setEarlyAccessInfoVisible] = useState(false);
  const [eolStackDate, setEolStackDate] = useState<string | null | undefined>(undefined);

  const filterredWebAppStacks = useMemo(
    () => filterDeprecatedWebAppStack(webAppStacks, stackVersionDetails.runtimeStackName, stackVersionDetails.minorVersionRuntime),
    [webAppStacks, stackVersionDetails.runtimeStackName, stackVersionDetails.minorVersionRuntime]
  );
  const runtimeOptions = useMemo(() => getRuntimeStacks(filterredWebAppStacks), [filterredWebAppStacks]);

  const isRuntimeStackDirty = (): boolean =>
    getRuntimeStack(values.config.properties.linuxFxVersion) !== getRuntimeStack(initialValues.config.properties.linuxFxVersion);

  const isMajorVersionDirty = (): boolean =>
    (majorVersionRuntime || '').toLowerCase() !== stackVersionDetails.majorVersionRuntime.toLowerCase();

  const isMinorVersionDirty = (): boolean => {
    if (runtimeStack) {
      const minorVersion = getSelectedMinorVersion(filterredWebAppStacks, runtimeStack, values.config.properties.linuxFxVersion);
      return (minorVersion || '').toLowerCase() !== stackVersionDetails.minorVersionRuntime.toLowerCase();
    } else {
      return false;
    }
  };

  const onRuntimeStackChange = (newRuntimeStack: string) => {
    setRuntimeStack(newRuntimeStack);
    if (newRuntimeStack !== LINUXJAVASTACKKEY) {
      const majorVersions = getMajorVersions(filterredWebAppStacks, newRuntimeStack);
      if (majorVersions.length > 0) {
        const majVer = majorVersions[0];
        setMajorVersionRuntime(majVer.key as string);
        const minorVersions = getMinorVersions(filterredWebAppStacks, newRuntimeStack, majVer.key as string, t);
        if (minorVersions.length > 0) {
          setFieldValue('config.properties.linuxFxVersion', minorVersions[0].key);
        }
      }
    }
  };

  const onMajorVersionChange = (newMajorVersion: string) => {
    if (runtimeStack) {
      const minorVersions = getMinorVersions(filterredWebAppStacks, runtimeStack, newMajorVersion, t);
      setMajorVersionRuntime(newMajorVersion);
      if (minorVersions.length > 0) {
        setFieldValue('config.properties.linuxFxVersion', minorVersions[0].key);
      }
    }
  };

  const getRuntimeStack = (linuxFxVersion: string) => {
    return isJavaStackSelected(filterredWebAppStacks, linuxFxVersion)
      ? LINUXJAVASTACKKEY
      : getSelectedRuntimeStack(filterredWebAppStacks, linuxFxVersion);
  };

  const setRuntimeStackAndMajorVersion = () => {
    setRuntimeStack(getRuntimeStack(values.config.properties.linuxFxVersion));
    setMajorVersionRuntime(getSelectedMajorVersion(filterredWebAppStacks, values.config.properties.linuxFxVersion));
  };

  const setEolDate = () => {
    setEarlyAccessInfoVisible(false);
    setEolStackDate(undefined);

    if (runtimeStack && majorVersionRuntime) {
      const minorVersions = getMinorVersions(filterredWebAppStacks, runtimeStack, majorVersionRuntime, t);
      const selectedMinorVersion = values.config.properties.linuxFxVersion.toLowerCase();
      for (const minorVersion of minorVersions) {
        if (minorVersion.key === selectedMinorVersion && minorVersion.data) {
          setEarlyAccessInfoVisible(!!minorVersion.data.isEarlyAccess);

          if (isStackVersionDeprecated(minorVersion.data)) {
            setEolStackDate(null);
          } else if (isStackVersionEndOfLife(minorVersion.data.endOfLifeDate)) {
            setEolStackDate(minorVersion.data.endOfLifeDate);
          }
          break;
        }
      }
    }
  };

  useEffect(() => {
    if (siteStateContext.isWordPressApp) {
      const initialLinuxFxVersion = initialValues?.config?.properties?.linuxFxVersion;
      if (initialLinuxFxVersion) {
        const updatedLinuxFxVersion = CommonConstants.WordPressLinuxFxVersionsMapping[initialLinuxFxVersion.toLocaleLowerCase()];
        if (updatedLinuxFxVersion) {
          setFieldValue('config.properties.linuxFxVersion', updatedLinuxFxVersion);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues?.config?.properties?.linuxFxVersion]);
  useEffect(() => {
    setEolDate();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.config.properties.linuxFxVersion, runtimeStack, majorVersionRuntime]);

  useEffect(() => {
    setRuntimeStackAndMajorVersion();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.config.properties.linuxFxVersion]);

  console.log(runtimeStack);

  return (
    <>
      {(scenarioService.checkScenario(ScenarioIds.linuxAppRuntime, { site }).status !== 'disabled' || siteStateContext.isWordPressApp) && (
        <>
          <DropdownNoFormik
            selectedKey={runtimeStack}
            dirty={isRuntimeStackDirty()}
            onChange={(e, newVal) => onRuntimeStackChange(newVal.key)}
            options={runtimeOptions}
            disabled={disableAllControls}
            label={t('stack')}
            id="linux-fx-version-runtime"
          />
          {runtimeStack &&
            (runtimeStack !== LINUXJAVASTACKKEY ? (
              <>
                <DropdownNoFormik
                  selectedKey={majorVersionRuntime || ''}
                  dirty={isMajorVersionDirty()}
                  onChange={(e, newVal) => onMajorVersionChange(newVal.key)}
                  options={getMajorVersions(filterredWebAppStacks, runtimeStack)}
                  disabled={disableAllControls}
                  label={t('majorVersion')}
                  id="linux-fx-version-major-version"
                />
                {majorVersionRuntime && (
                  <>
                    <Field
                      name="config.properties.linuxFxVersion"
                      dirty={isMinorVersionDirty()}
                      component={Dropdown}
                      disabled={disableAllControls}
                      label={t('minorVersion')}
                      id="linux-fx-version-minor-version"
                      options={getMinorVersions(filterredWebAppStacks, runtimeStack, majorVersionRuntime, t)}
                      {...getEarlyStackMessageParameters(earlyAccessInfoVisible, t)}
                    />
                    {checkAndGetStackEOLOrDeprecatedBanner(t, values.config.properties.linuxFxVersion, eolStackDate)}
                  </>
                )}
              </>
            ) : (
              <JavaStack {...props} />
            ))}
        </>
      )}
      {!siteStateContext.isFunctionApp && (
        <Field
          name="config.properties.appCommandLine"
          component={TextField}
          dirty={values.config.properties.appCommandLine !== initialValues.config.properties.appCommandLine}
          disabled={disableAllControls}
          label={t('appCommandLineLabel')}
          id="linux-fx-version-appCommandLine"
          infoBubbleMessage={t('appCommandLineLabelHelpNoLink')}
          learnMoreLink={Links.linuxContainersLearnMore}
          style={{ marginLeft: '1px', marginTop: '1px' }} // Not sure why but left border disappears without margin and for small windows the top also disappears
          multiline={true}
          autoAdjustHeight={true}
        />
      )}
    </>
  );
};
export default LinuxStacks;
