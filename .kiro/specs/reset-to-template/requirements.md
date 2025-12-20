# Requirements Document

## Introduction

本功能为 VS Code LeetCode 扩展添加一个"恢复到默认模板"按钮，该按钮将显示在 Submit 和 Test 按钮旁边。当用户点击此按钮时，当前打开的 LeetCode 问题文件将被重置为该问题的默认代码模板，帮助用户在需要重新开始时快速恢复到初始状态。

## Glossary

- **CodeLens**: VS Code 提供的一种在代码编辑器中显示可操作链接的机制，本扩展使用它来显示 Submit、Test 等按钮
- **Default Template**: LeetCode 为每个问题提供的初始代码模板，包含函数签名和必要的注释
- **Problem File**: 用户本地保存的 LeetCode 问题解答文件，包含 `@lc app=...` 标记

## Requirements

### Requirement 1

**User Story:** As a LeetCode user, I want to reset my solution file to the default template, so that I can start fresh when my current approach isn't working.

#### Acceptance Criteria

1. WHEN a user clicks the "Reset" button in the CodeLens area THEN the System SHALL display a confirmation dialog asking the user to confirm the reset action
2. WHEN a user confirms the reset action THEN the System SHALL replace the current file content with the default code template for that problem
3. WHEN a user cancels the reset confirmation THEN the System SHALL keep the current file content unchanged
4. IF the problem ID cannot be extracted from the current file THEN the System SHALL display an error message indicating the file is not a valid LeetCode problem file
5. WHEN the reset operation completes successfully THEN the System SHALL display a success notification to the user

### Requirement 2

**User Story:** As a user, I want the Reset button to be positioned consistently with other buttons, so that I can easily find and use it.

#### Acceptance Criteria

1. WHEN the Reset button is displayed THEN the System SHALL position it immediately after the Test button in the CodeLens area (显示为 Submit | Test | Reset)
2. WHEN the Reset button is displayed THEN the System SHALL use a clear label "Reset" that indicates its function
