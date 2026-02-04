
            CREATE   PROCEDURE Inv_sp_cat_listar
                @entidad NVARCHAR(50)
            AS
            BEGIN
                IF @entidad = 'CATEGORIAS' SELECT * FROM Inv_cat_categorias_producto WHERE activo = 1;
                ELSE IF @entidad = 'PROVEEDORES' SELECT * FROM Inv_cat_proveedores WHERE activo = 1;
                ELSE IF @entidad = 'PRODUCTOS' SELECT * FROM Inv_cat_productos WHERE activo = 1;
                ELSE IF @entidad = 'ALMACENES' SELECT * FROM Inv_cat_almacenes WHERE activo = 1;
                ELSE IF @entidad = 'CLIENTES' SELECT * FROM Inv_cat_clientes WHERE activo = 1;
                ELSE IF @entidad = 'TIPO_OT' SELECT * FROM Inv_cat_tipos_ot WHERE activo = 1;
            END
        
GO