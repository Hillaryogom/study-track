import { isDemoMode } from "../lib/env";
import type { AuthService } from "./auth/AuthService";
import { DemoAuthService } from "./auth/DemoAuthService";
import { FirebaseAuthService } from "./auth/FirebaseAuthService";
import { DemoStudyRepository } from "./study/DemoStudyRepository";
import { FirestoreStudyRepository } from "./study/FirestoreStudyRepository";
import type { StudyRepository } from "./study/StudyRepository";

/**
 * Adapter selection happens once, here. Features depend on the contracts only, so
 * swapping Firebase for the local demo adapters changes no feature code.
 */
const demo = isDemoMode();

export const authService: AuthService = demo ? new DemoAuthService() : new FirebaseAuthService();
export const studyRepository: StudyRepository = demo
  ? new DemoStudyRepository()
  : new FirestoreStudyRepository();
export const usingDemoData = demo;
