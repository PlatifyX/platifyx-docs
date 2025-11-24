ALTER TABLE integrations 
ADD COLUMN IF NOT EXISTS organization_uuid UUID REFERENCES organizations(uuid) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_integrations_organization_uuid ON integrations(organization_uuid);

UPDATE integrations 
SET organization_uuid = (SELECT uuid FROM organizations LIMIT 1)
WHERE organization_uuid IS NULL AND EXISTS (SELECT 1 FROM organizations LIMIT 1);

