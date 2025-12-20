# Implementation Plan

- [x] 1. Add reset command infrastructure
  - [x] 1.1 Create `src/commands/reset.ts` with basic command structure
    - Create the file with `resetToTemplate` function signature
    - Import necessary dependencies (vscode, fs-extra, etc.)
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Register the command in `src/extension.ts`
    - Add import for reset command
    - Register `leetcode.resetToTemplate` command in activate function
    - _Requirements: 1.1_
  - [x] 1.3 Declare the command in `package.json`
    - Add command definition in contributes.commands
    - _Requirements: 1.1_

- [x] 2. Implement reset functionality
  - [x] 2.1 Add `getDefaultTemplate` method to `LeetCodeExecutor`
    - Implement method to fetch default template using leetcode CLI
    - Use existing `showProblem` logic as reference
    - _Requirements: 1.2_
  - [x] 2.2 Implement `resetToTemplate` command logic
    - Extract problem ID and language from current file
    - Show confirmation dialog using `vscode.window.showWarningMessage`
    - Fetch default template and write to file on confirmation
    - Show success/error notifications
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ]* 2.3 Write property test for reset produces valid template
    - **Property 1: Reset produces valid template content**
    - **Validates: Requirements 1.2**
  - [ ]* 2.4 Write property test for cancel preserves content
    - **Property 2: Cancel preserves file content**
    - **Validates: Requirements 1.3**

- [x] 3. Add CodeLens button
  - [x] 3.1 Modify `CustomCodeLensProvider` to include Reset button
    - Add Reset CodeLens after Test button
    - Use "Reset" as button label
    - _Requirements: 2.1, 2.2_
  - [x] 3.2 Update default editor shortcuts configuration
    - Add "reset" to default shortcuts array in `settingUtils.ts`
    - Update `package.json` configuration schema if needed
    - _Requirements: 2.1_
  - [ ]* 3.3 Write property test for CodeLens button ordering
    - **Property 3: CodeLens button ordering**
    - **Validates: Requirements 2.1**

- [ ] 4. Checkpoint - Make sure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
