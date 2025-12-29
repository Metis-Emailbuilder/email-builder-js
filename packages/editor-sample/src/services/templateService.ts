import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Template {
  id?: string;
  userId: string;
  name: string;
  jsonConfig: any;
  html?: string;
  lastModified: Timestamp | Date;
}

// Save template to Firestore with schema: users/{userId}/templates/{templateId}
export async function saveTemplate(
  userId: string,
  templateId: string | null,
  name: string,
  jsonConfig: any,
  html?: string
) {
  try {
    const timestamp = Timestamp.now();
    const templateData = {
      name,
      jsonConfig,
      html: html || '',
      lastModified: timestamp,
    };

    if (templateId) {
      // Update existing template
      await updateDoc(doc(db, `users/${userId}/templates/${templateId}`), templateData);
      return templateId;
    } else {
      // Create new template
      const templateRef = doc(collection(db, `users/${userId}/templates`));
      await setDoc(templateRef, templateData);
      return templateRef.id;
    }
  } catch (error) {
    console.error('Error saving template:', error);
    throw error;
  }
}

// Get all templates for a user
export async function getUserTemplates(userId: string): Promise<Template[]> {
  try {
    const templatesSnapshot = await getDocs(
      collection(db, `users/${userId}/templates`)
    );
    return templatesSnapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      userId,
      ...docSnapshot.data(),
    } as Template));
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
}

// Get a specific template
export async function getTemplate(userId: string, templateId: string): Promise<Template | null> {
  try {
    const templateDoc = await getDoc(doc(db, `users/${userId}/templates/${templateId}`));
    if (!templateDoc.exists()) {
      return null;
    }
    return {
      id: templateDoc.id,
      userId,
      ...templateDoc.data(),
    } as Template;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
}

// Delete a template
export async function deleteTemplate(userId: string, templateId: string) {
  try {
    await deleteDoc(doc(db, `users/${userId}/templates/${templateId}`));
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

// Update a template
export async function updateTemplate(
  userId: string,
  templateId: string,
  updates: Partial<Template>
) {
  try {
    const templateRef = doc(db, `users/${userId}/templates/${templateId}`);
    const updateData: any = { ...updates };
    if (!updateData.lastModified) {
      updateData.lastModified = Timestamp.now();
    }
    await updateDoc(templateRef, updateData);
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}
