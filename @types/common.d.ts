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