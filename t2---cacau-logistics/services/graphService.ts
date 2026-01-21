
import { LIST_IDS } from '../constants';

/**
 * Service for interacting with Microsoft Graph API and SharePoint Lists.
 * Uses the specific field names provided in the requirement.
 */

const SITE_ID = 'vialacteoscombr.sharepoint.com'; // Placeholder, typically needs a real Site ID from Graph

const getHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
});

export const fetchListItems = async (accessToken: string, listId: string) => {
  try {
    const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${SITE_ID}/lists/${listId}/items?expand=fields`, {
      headers: getHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Graph API Error');
    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error('Error fetching from SharePoint:', error);
    return [];
  }
};

export const createListItem = async (accessToken: string, listId: string, fields: any) => {
  try {
    const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${SITE_ID}/lists/${listId}/items`, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify({ fields }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating SharePoint item:', error);
  }
};

export const updateListItem = async (accessToken: string, listId: string, itemId: string, fields: any) => {
  try {
    const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${SITE_ID}/lists/${listId}/items/${itemId}/fields`, {
      method: 'PATCH',
      headers: getHeaders(accessToken),
      body: JSON.stringify(fields),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating SharePoint item:', error);
  }
};

export const deleteListItem = async (accessToken: string, listId: string, itemId: string) => {
  try {
    await fetch(`https://graph.microsoft.com/v1.0/sites/${SITE_ID}/lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
      headers: getHeaders(accessToken),
    });
    return true;
  } catch (error) {
    console.error('Error deleting SharePoint item:', error);
    return false;
  }
};
