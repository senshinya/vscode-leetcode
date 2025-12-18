# Requirements Document

## Introduction

本功能为 LeetCode VS Code 扩展添加本地进度追踪能力。用户可以创建独立的学习进度，将题目完成状态和通过的题解保存在本地进度文件中，而不依赖 LeetCode 远程服务器的状态。当选中某个进度时，题目的完成状态将从本地进度文件读取；未选中进度时，继续使用 LeetCode 远程状态。对于进度中标记为未完成的题目，打开时展示默认内容而非网页题解。

## Glossary

- **Progress（进度）**: 一个本地存储的学习进度记录，包含题目完成状态和通过的题解
- **Progress File（进度文件）**: 存储进度数据的 JSON 文件，位于工作目录下
- **Problem State（题目状态）**: 题目的完成状态，包括已通过(AC)、未通过(NotAC)、未知(Unknown)
- **Solution（题解）**: 用户通过某道题目时提交的代码
- **Active Progress（当前进度）**: 用户当前选中的进度，用于覆盖远程状态显示
- **Remote State（远程状态）**: 从 LeetCode 服务器获取的题目完成状态

## Requirements

### Requirement 1

**User Story:** As a user, I want to create a new progress, so that I can track my learning independently from LeetCode's remote state.

#### Acceptance Criteria

1. WHEN a user executes the "Create Progress" command THEN the System SHALL prompt for a progress name and create a new progress file in the workspace directory
2. WHEN a progress is created THEN the System SHALL initialize the progress file with an empty problem state map and empty solution storage
3. WHEN a user attempts to create a progress with a duplicate name THEN the System SHALL display an error message and prevent the creation
4. WHEN a progress file is created THEN the System SHALL use JSON format for serialization

### Requirement 2

**User Story:** As a user, I want to select or deselect a progress, so that I can switch between local progress tracking and remote state.

#### Acceptance Criteria

1. WHEN a user executes the "Select Progress" command THEN the System SHALL display a list of available progresses for selection
2. WHEN a user selects a progress THEN the System SHALL set that progress as the active progress and refresh the problem explorer
3. WHEN a user selects "None" or deselects the current progress THEN the System SHALL clear the active progress and use remote state for problem display
4. WHEN an active progress is set THEN the System SHALL persist the selection across VS Code sessions

### Requirement 3

**User Story:** As a user, I want to see problem completion status from my selected progress, so that I can track my local learning progress.

#### Acceptance Criteria

1. WHILE an active progress is selected, WHEN the problem explorer displays problems THEN the System SHALL show completion status from the progress file instead of remote state
2. WHILE no active progress is selected, WHEN the problem explorer displays problems THEN the System SHALL show completion status from LeetCode remote state
3. WHEN a problem's state is updated in the progress THEN the System SHALL immediately reflect the change in the problem explorer

### Requirement 4

**User Story:** As a user, I want to mark problems as completed or uncompleted in my progress, so that I can manually manage my learning status.

#### Acceptance Criteria

1. WHEN a user submits a solution successfully WHILE an active progress is selected THEN the System SHALL mark the problem as completed in the progress file and store the solution
2. WHEN a user executes "Mark as Completed" on a problem WHILE an active progress is selected THEN the System SHALL update the problem state to AC in the progress file
3. WHEN a user executes "Mark as Uncompleted" on a problem WHILE an active progress is selected THEN the System SHALL update the problem state to NotAC in the progress file
4. WHEN a problem state is updated THEN the System SHALL persist the change to the progress file immediately

### Requirement 5

**User Story:** As a user, I want my passed solutions to be stored in the progress, so that I can review my solutions later.

#### Acceptance Criteria

1. WHEN a solution is submitted successfully WHILE an active progress is selected THEN the System SHALL store the solution code in the progress file
2. WHEN storing a solution THEN the System SHALL associate the solution with the problem ID and include the programming language
3. WHEN a problem already has a stored solution and a new solution is submitted THEN the System SHALL overwrite the existing solution with the new one
4. WHEN a user requests to view a stored solution THEN the System SHALL retrieve and display the solution from the progress file

### Requirement 6

**User Story:** As a user, I want to see default problem content instead of web solutions when opening uncompleted problems, so that I can solve problems without spoilers.

#### Acceptance Criteria

1. WHILE an active progress is selected AND a problem is marked as uncompleted, WHEN the user opens the problem THEN the System SHALL display the default problem template without showing web solutions
2. WHILE an active progress is selected AND a problem is marked as completed, WHEN the user opens the problem THEN the System SHALL allow viewing the stored solution from the progress file
3. WHILE no active progress is selected, WHEN the user opens a problem THEN the System SHALL use the default behavior (show web solutions if available)

### Requirement 7

**User Story:** As a user, I want to delete a progress, so that I can remove progresses I no longer need.

#### Acceptance Criteria

1. WHEN a user executes the "Delete Progress" command THEN the System SHALL display a list of available progresses for deletion
2. WHEN a user confirms deletion of a progress THEN the System SHALL remove the progress file from the workspace
3. IF the deleted progress is the active progress THEN the System SHALL clear the active progress selection and refresh the problem explorer
4. WHEN deleting a progress THEN the System SHALL prompt for confirmation before deletion

### Requirement 8

**User Story:** As a user, I want to list all my progresses, so that I can see what progresses I have created.

#### Acceptance Criteria

1. WHEN a user executes the "List Progresses" command THEN the System SHALL display all available progresses with their names
2. WHEN displaying progresses THEN the System SHALL indicate which progress is currently active (if any)
3. WHEN no progresses exist THEN the System SHALL display a message indicating no progresses are available
