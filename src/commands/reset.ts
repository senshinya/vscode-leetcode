// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as fse from "fs-extra";
import * as vscode from "vscode";
import { leetCodeChannel } from "../leetCodeChannel";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { leetCodeManager } from "../leetCodeManager";
import { getDescriptionConfiguration } from "../utils/settingUtils";
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";
import { getActiveFilePath } from "../utils/workspaceUtils";

/**
 * Resets the current LeetCode problem file to its default template.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 * @param uri Optional URI of the file to reset
 */
export async function resetToTemplate(uri?: vscode.Uri): Promise<void> {
    // Check if user is signed in
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
        return;
    }

    // Get the active file path
    const filePath: string | undefined = await getActiveFilePath(uri);
    if (!filePath) {
        return;
    }

    try {
        // Extract problem metadata from file
        const fileContent = await fse.readFile(filePath, "utf8");
        const problemId = extractProblemId(fileContent);
        const language = extractLanguage(fileContent);

        // Requirement 1.4: Show error if problem ID cannot be extracted
        if (!problemId || !language) {
            vscode.window.showErrorMessage("Failed to resolve the problem id from file. Please make sure this is a valid LeetCode problem file.");
            return;
        }

        // Requirement 1.1: Show confirmation dialog
        const confirm = await vscode.window.showWarningMessage(
            "Are you sure you want to reset this file to the default template? All your current code will be lost.",
            { modal: true },
            "Reset"
        );

        // Requirement 1.3: If user cancels, do nothing
        if (confirm !== "Reset") {
            return;
        }

        // Requirement 1.2: Fetch default template and write to file
        const descriptionConfig = getDescriptionConfiguration();
        const template = await leetCodeExecutor.getDefaultTemplate(problemId, language, descriptionConfig.showInComment);
        await fse.writeFile(filePath, template, "utf8");

        // Requirement 1.5: Show success notification
        vscode.window.showInformationMessage("Successfully reset to default template.");
    } catch (error) {
        leetCodeChannel.appendLine((error as Error).toString());
        await promptForOpenOutputChannel("Failed to reset to template. Please open the output channel for details.", DialogType.error);
    }
}

/**
 * Extracts the problem ID from file content
 * @param content The file content
 * @returns The problem ID or undefined if not found
 */
export function extractProblemId(content: string): string | undefined {
    const match = content.match(/@lc\s+app=\S+\s+id=(\S+)/);
    return match ? match[1] : undefined;
}

/**
 * Extracts the language from file content
 * @param content The file content
 * @returns The language or undefined if not found
 */
export function extractLanguage(content: string): string | undefined {
    const match = content.match(/@lc\s+app=\S+\s+id=\S+\s+lang=(\S+)/);
    return match ? match[1] : undefined;
}
