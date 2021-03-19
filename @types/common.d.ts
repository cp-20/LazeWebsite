interface loginResult {
	success: boolean;
	userData: userData;
}

interface userData {
	id: string;
	name: string;
	avatar: string;
}

interface loadedProject {
	value: dirObject;
}

interface dirObject {
	type: 'file' | 'folder';
	name: string;
	value?: dirObject[];
}

interface saveResult {
	value: string;
	style: 'info' | 'err';
}