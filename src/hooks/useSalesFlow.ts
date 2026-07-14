import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEVICE_STEP, flowStepById, INITIAL_PHONE_STEP, progressStepIds } from '../data/flowSteps';
import { createTrial, saveFlowProgress } from '../services/customerFlowService';
import type { FlowOption, PhoneSource, SalesFlowData, SelectedApp } from '../types/salesFlow';
import { getPhoneFromSearch, normalizeBrazilianPhone } from '../utils/phone';
import { clearSalesFlow, loadSalesFlow, saveSalesFlow } from '../utils/storage';

const initialData: SalesFlowData = {
  phone: '',
  phoneSource: null,
  device: null,
  hasPlayStore: null,
  hasDownloader: null,
  hasNtDown: null,
  selectedApp: null,
  currentStep: INITIAL_PHONE_STEP,
  history: [],
  answers: [],
  trial: { status: 'idle' },
};

function getInitialData(): SalesFlowData {
  const saved = loadSalesFlow();

  if (saved) {
    return {
      ...initialData,
      ...saved,
      trial: saved.trial ?? { status: 'idle' },
    };
  }

  const urlPhone = getPhoneFromSearch(window.location.search);

  if (urlPhone) {
    return {
      ...initialData,
      phone: urlPhone,
      phoneSource: 'url',
      currentStep: 'phone-confirm',
    };
  }

  return initialData;
}

function clearDeviceData(data: SalesFlowData): SalesFlowData {
  return {
    ...data,
    device: null,
    hasPlayStore: null,
    hasDownloader: null,
    hasNtDown: null,
    selectedApp: null,
    answers: data.answers.filter((answer) =>
      [INITIAL_PHONE_STEP, 'phone-confirm'].includes(answer.step),
    ),
  };
}

export function useSalesFlow() {
  const [data, setData] = useState<SalesFlowData>(() => getInitialData());
  const [isBusy, setIsBusy] = useState(false);

  const currentStep = flowStepById[data.currentStep] ?? flowStepById[INITIAL_PHONE_STEP];

  useEffect(() => {
    saveSalesFlow(data);
    void saveFlowProgress(data);
  }, [data]);

  const progress = useMemo(() => {
    const currentIndex = progressStepIds.indexOf(data.currentStep);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    return Math.max(8, Math.round(((safeIndex + 1) / progressStepIds.length) * 100));
  }, [data.currentStep]);

  const goToStep = useCallback((nextStep: string, answer: string, mutation = {}) => {
    setData((previous) => ({
      ...previous,
      ...mutation,
      currentStep: nextStep,
      history: [...previous.history, previous.currentStep],
      answers: [
        ...previous.answers,
        {
          step: previous.currentStep,
          answer,
          answeredAt: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const submitPhone = useCallback((phone: string, source: PhoneSource) => {
    const normalized = normalizeBrazilianPhone(phone);
    setData((previous) => ({
      ...previous,
      phone: normalized,
      phoneSource: source,
      currentStep: DEVICE_STEP,
      history: [...previous.history, previous.currentStep],
      answers: [
        ...previous.answers,
        {
          step: previous.currentStep,
          answer: 'PHONE_SUBMITTED',
          answeredAt: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const chooseOption = useCallback(
    (option: FlowOption) => {
      if (option.external === 'support') {
        setData((previous) => ({
          ...previous,
          answers: [
            ...previous.answers,
            {
              step: previous.currentStep,
              answer: option.value,
              answeredAt: new Date().toISOString(),
            },
          ],
        }));
        return;
      }

      setData((previous) => {
        const baseData = option.clearDeviceSpecific ? clearDeviceData(previous) : previous;

        return {
          ...baseData,
          ...option.mutation,
          currentStep: option.nextStep,
          history: [...baseData.history, previous.currentStep],
          answers: [
            ...baseData.answers,
            {
              step: previous.currentStep,
              answer: option.value,
              answeredAt: new Date().toISOString(),
            },
          ],
        };
      });
    },
    [],
  );

  const goBack = useCallback(() => {
    setData((previous) => {
      const nextHistory = [...previous.history];
      const previousStep = nextHistory.pop();

      if (!previousStep) {
        return previous;
      }

      return {
        ...previous,
        currentStep: previousStep,
        history: nextHistory,
      };
    });
  }, []);

  const restart = useCallback(() => {
    clearSalesFlow();
    setData(initialData);
  }, []);

  const chooseAnotherDevice = useCallback(() => {
    setData((previous) => {
      const nextData = clearDeviceData(previous);
      return {
        ...nextData,
        currentStep: DEVICE_STEP,
        history: [...previous.history, previous.currentStep],
        answers: [
          ...nextData.answers,
          {
            step: previous.currentStep,
            answer: 'OTHER_DEVICE',
            answeredAt: new Date().toISOString(),
          },
        ],
      };
    });
  }, []);

  const prepareTrial = useCallback(async (selectedApp: SelectedApp | undefined) => {
    setIsBusy(true);
    const app = selectedApp ?? data.selectedApp;

    try {
      const result = await createTrial({
        ...data,
        selectedApp: app ?? data.selectedApp,
      });

      const nextData: SalesFlowData = {
        ...data,
        selectedApp: app ?? data.selectedApp,
        currentStep: 'trial-placeholder',
        history: [...data.history, data.currentStep],
        trial: {
          status: 'success',
          message: result.message,
          appName: result.appName,
          username: result.username,
          password: result.password,
          accessLabel: result.accessLabel,
          accessCode: result.accessCode,
          adultPassword: result.adultPassword,
          expiresAt: result.expiresAt,
          testDuration: result.testDuration,
          createdAt: new Date().toISOString(),
        },
        answers: [
          ...data.answers,
          {
            step: data.currentStep,
            answer: 'CREATE_TRIAL_CLICKED',
            answeredAt: new Date().toISOString(),
          },
        ],
      };

      setData(nextData);
    } catch (error) {
      const nextData: SalesFlowData = {
        ...data,
        selectedApp: app ?? data.selectedApp,
        currentStep: 'trial-placeholder',
        history: [...data.history, data.currentStep],
        trial: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Nao foi possivel criar o teste.',
        },
        answers: [
          ...data.answers,
          {
            step: data.currentStep,
            answer: 'CREATE_TRIAL_FAILED',
            answeredAt: new Date().toISOString(),
          },
        ],
      };

      setData(nextData);
    } finally {
      setIsBusy(false);
    }
  }, [data]);

  return {
    data,
    currentStep,
    progress,
    canGoBack: data.history.length > 0,
    isBusy,
    chooseAnotherDevice,
    chooseOption,
    goBack,
    prepareTrial,
    restart,
    submitPhone,
    setManualPhoneStep: () =>
      setData((previous) => ({
        ...previous,
        phone: '',
        phoneSource: 'manual',
        currentStep: INITIAL_PHONE_STEP,
      })),
    goToStep,
  };
}
