// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as fse from "fs-extra";
import * as vscode from "vscode";
import { leetCodeTreeDataProvider } from "../explorer/LeetCodeTreeDataProvider";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { leetCodeManager } from "../leetCodeManager";
import { progressManager } from "../progress/progressManager";
import { ProblemState } from "../shared";
import { getNodeIdFromFile } from "../utils/problemUtils";
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";
import { getActiveFilePath } from "../utils/workspaceUtils";
import { leetCodeSubmissionProvider } from "../webview/leetCodeSubmissionProvider";

export async function submitSolution(uri?: vscode.Uri): Promise<void> {
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
        return;
    }

    const filePath: string | undefined = await getActiveFilePath(uri);
    if (!filePath) {
        return;
    }

    try {
        const result: string = await leetCodeExecutor.submitSolution(filePath);
        leetCodeSubmissionProvider.show(result);

        // If submission was successful and there's an active progress, store the solution
        // Requirements: 4.1, 5.1
        if (isSubmissionAccepted(result) && progressManager.hasActiveProgress()) {
            await storeSuccessfulSubmission(filePath);
        }
    } catch (error) {
        await promptForOpenOutputChannel("Failed to submit the solution. Please open the output channel for details.", DialogType.error);
        return;
    }

    leetCodeTreeDataProvider.refresh();
}

/**
 * Checks if the submission result indicates acceptance
 * @param result The raw submission result string
 * @returns true if the submission was accepted
 */
function isSubmissionAccepted(result: string): boolean {
    // The result contains "Accepted" as the first message when successful
    return result.includes("Accepted");
}

/**
 * Stores a successful submission in the active progress
 * @param filePath The path to the solution file
 * Requirements: 4.1, 5.1
 */
async function storeSuccessfulSubmission(filePath: string): Promise<void> {
    try {
        // Get problem ID from file
        const problemId = await getNodeIdFromFile(filePath);
        if (!problemId) {
            return;
        }

        // Read the solution code
        const code = await fse.readFile(filePath, "utf8");

        // Detect language from file extension
        const language = detectLanguageFromPath(filePath);

        // Store the solution and mark as completed
        await progressManager.storeSolution(problemId, language, code);
        await progressManager.setProblemState(problemId, ProblemState.AC);
    } catch (error) {
        // Silently fail - don't interrupt the user's workflow for progress tracking errors
        console.error("Failed to store solution in progress:", error);
    }
}

/**
 * Detects the programming language from the file path extension
 * @param filePath The path to the solution file
 * @returns The detected language name
 */
function detectLanguageFromPath(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const extToLang: { [key: string]: string } = {
        "js": "javascript",
        "ts": "typescript",
        "py": "python3",
        "java": "java",
        "cpp": "cpp",
        "c": "c",
        "cs": "csharp",
        "go": "golang",
        "rb": "ruby",
        "swift": "swift",
        "kt": "kotlin",
        "rs": "rust",
        "scala": "scala",
        "php": "php",
        "sql": "mysql",
        "sh": "bash",
    };
    return extToLang[ext] || ext;
}
