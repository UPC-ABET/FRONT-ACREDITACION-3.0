'use client'

import { CheckIcon } from '@heroicons/react/24/solid'

interface Step {
  label: string
  description: string
}

interface WizardStepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function WizardStepIndicator({ steps, currentStep }: WizardStepIndicatorProps) {
  return (
    <nav aria-label="Pasos del wizard">
      <ol className="flex items-start gap-0">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isActive = stepNumber === currentStep

          return (
            <li key={step.label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  {/* Connector left */}
                  <div
                    className={`flex-1 h-0.5 ${index === 0 ? 'invisible' : isCompleted || isActive ? 'bg-red-600' : 'bg-zinc-200'}`}
                  />
                  {/* Circle */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                      isCompleted
                        ? 'border-red-600 bg-red-600 text-white'
                        : isActive
                          ? 'border-red-600 bg-white text-red-600'
                          : 'border-zinc-300 bg-white text-zinc-400'
                    }`}
                  >
                    {isCompleted ? <CheckIcon className="h-4 w-4" /> : stepNumber}
                  </div>
                  {/* Connector right */}
                  <div
                    className={`flex-1 h-0.5 ${index === steps.length - 1 ? 'invisible' : isCompleted ? 'bg-red-600' : 'bg-zinc-200'}`}
                  />
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-xs font-semibold ${isActive ? 'text-red-600' : isCompleted ? 'text-zinc-700' : 'text-zinc-400'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-zinc-500 hidden sm:block">{step.description}</p>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
